//varify wheather user is there or not
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";
import { user } from '../modles/user.model.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, " Unauthrised request");
        }
        console.log(token)

        const decodedToken = jwt.verify(token.toString(), process.env.ACCESS_TOKEN_SECRET);
        const User = await user.findById(decodedToken?._id).select("-password -refreshToken")
        if (!User) {
            throw new ApiError(401, "Invalid Access Token")
        }   

        req.User = User;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token")
    }

})