import {Router} from "express";
import { registerUser,loginuser, logoutuser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChanelProfile,getWatchHistory} from "../controllers/user.controller.js";
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

UserRouter.route("/refresh-token").post(refreshAccessToken)
UserRouter.route("/change-password").post(verifyJWT,changeCurrentPassword)
UserRouter.route("/current-user").get(verifyJWT,getCurrentUser)
UserRouter.route("/update-account").patch(verifyJWT,updateAccountDetails)
UserRouter.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
UserRouter.route("/update-coverimg").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
UserRouter.route("/c/:username").get(verifyJWT,getUserChanelProfile)
UserRouter.route("/history-watch").get(verifyJWT,getWatchHistory)

export default UserRouter;