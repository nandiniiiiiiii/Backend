import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { user } from '../modles/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';

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
    const { accessToken , refreshToken} = await generateAccessandRefereshTokens(User._id)
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
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out"
        )
    )
})

export {
    registerUser,
    loginuser,
    logoutuser
}