import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { user } from '../modles/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';

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
    const coverImageLocalPath = req.files?.coverimage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avtar is required");
    }

    //4- upload to cloudinary
    const avtar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avtar) {
        throw new ApiError(400, "Avtar is necessary")
    }

    //5- send to db via obj.
    const User = user.create({
        fullname,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //6- remove password and refresh token for response
    const createuser = await User.findById(User._id).select(
        "-password -refreshToken"
    )

    //7- check for user created
    if(!createuser){
        throw new ApiError(500,"something went wrong while registering user")
    }

    //8- return res
    return res.status(201).json(
        new ApiResponse(200, createuser,"user registerd successfuly")
    )

})

export {
    registerUser
}