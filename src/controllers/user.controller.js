import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { user } from '../modles/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

//method to generate access and refresh tokens
const generateAccessandRefereshTokens = async (userId) => {
    try {
        const User = await user.findById(userId)
        const accessToken = User.generateAccessToken()
        const refreshToken = User.generateRefreshToken()

        User.refreshToken = refreshToken
        await User.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access tokens")
    }
}

//to register user
const registerUser = asyncHandler(async (req, res) => {
    //CREATING UERREGISTERATION FORM

    //1- take input
    const { fullname, email, username, password } = req.body
    console.log("Email: ", email)

    //2- not empty - and non existing
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }
    const existedUser = await user.findOne({
        $or: [{ username }, { email },]
    })
    if (existedUser) {
        throw new ApiError(409, "user already exist")
    }

    //3- check for img/avtar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverimage[0]?.path;
    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    //4- upload to cloudinary
    const avtar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avtar) {
        throw new ApiError(400, "Avtar is necessary")
    }

    //5- send to db via obj.
    const User = await user.create({
        fullname,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //6- remove password and refresh token for response
    const createuser = await user.findById(User._id).select(
        "-password -refreshToken"
    )

    //7- check for user created
    if (!createuser) {
        throw new ApiError(500, "something went wrong while registering user")
    }

    //8- return res
    return res.status(201).json(
        new ApiResponse(200, createuser, "user registerd successfuly")
    )

})

//to login user
const loginuser = asyncHandler(async (req, res) => {
    //req body -> data
    const { username, email, password } = req.body

    //check for username and email
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    //find user- either username or email
    const User = await user.findOne({
        $or: [{ username }, { email }]
    })
    if (!User) {
        throw new ApiError(400, "user not found")
    }

    //check password
    const isPasswordvalid = await User.isPasswordCorrect(password);
    if (!isPasswordvalid) {
        throw new ApiError(400, "invalid user credentials")
    }

    //access and reresh tokens
    const { accessToken, refreshToken } = await generateAccessandRefereshTokens(User._id)
    // console.log(accessToken,refreshToken)
    const loginUser = await user.findById(User._id).select("-passsword -refreshToken");

    //sending to cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loginUser, accessToken, refreshToken
                },
                "User logged in Successfully"
            )
        )
})

const logoutuser = asyncHandler(async (req, res) => {
    user.findByIdAndUpdate(
        req.User._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out"
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token not valid")
    }
    //varifying incomingRefreshToken
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const User = await user.findById(decodedToken?._id);
        if (!User) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== User?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessandRefereshTokens(User._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshTokens", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid Refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const User = await user.findById(req.User?._id)
    if(!User){
        throw new ApiError(400, "no user avaliable")
    }
    const isPasswordCorrect = await User.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    User.password = newPassword
    await User.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password changed successfuly"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new ApiResponse(200, req.User, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All field are required")
    }

    const User = user.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }
    ).select("-paassword")

    return res.status(200)
        .json(new ApiResponse(200, User, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    //take file localy via multer
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatart not present")
    }

    //uplode on cloudnary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while aploading avatar")
    }

    //updating avatar
    const User = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, User, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    //take file localy via multer
    const converImageLocalPath = req.file?.path
    if (!converImageLocalPath) {
        throw new ApiError(400, "cover image not present")
    }

    //uplode on cloudnary
    const coverImage = await uploadOnCloudinary(converImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error while aploading cover Image")
    }

    //updating avatar
    const User = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                converImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, User, "cover image updated successfully"))
})

const getUserChanelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "usernaem is missing")
    }

    const channel = await user.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "Subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "Subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
    console.log(channel)   //data type aggregate returns
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, channel[0], "user channel fetched successfuly")
        )

})

const getWatchHistory = asyncHandler(async (req, res) => {
    //req.user._id        //this gives us string not the proper mongooDB id
    const User = await user.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.User._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "WatchHistory",
                pipeline: [   //to nest a pipeline/lookup
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ],
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ],
            }
        }
    ])
    if(!User){
        new ApiError(400,"User not found")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200, 
                User[0].watchHistory,
                "watchHistory fetched successfuly"
            )
        )
})

export {
    registerUser,
    loginuser,
    logoutuser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChanelProfile,
    getWatchHistory
}