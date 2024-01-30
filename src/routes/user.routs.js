import {Router} from "express";
import { registerUser,loginuser, logoutuser,refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const UserRouter = Router();

UserRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    registerUser
    )

UserRouter.route("/login").post(
    loginuser
)

UserRouter.route("/logout").post(
    verifyJWT,
    logoutuser
)

UserRouter.route("/refresh-token").post(
    refreshAccessToken
)

export default UserRouter;