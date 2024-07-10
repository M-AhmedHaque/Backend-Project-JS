import { Router } from "express";   
import { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateUsernameAndEmail,
    updateCoverImage,
    updateAvatar,
    userProfile,
    getUserWatchHistory
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyjwt} from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/registeration").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes

// router.route("/logout").post(verifyjwt,logoutUser)
// router.route("/refresh-token").post(refreshAccessToken)
// router.route("/update-fullname-email").post(verifyjwt,updateUsernameAndEmail)
router.route("/logout").post(verifyjwt,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyjwt, changePassword)
router.route("/current-user").get(verifyjwt, getUser)
router.route("/update-account").patch(verifyjwt, updateUsernameAndEmail)

router.route("/avatar").patch(verifyjwt, upload.single("avatar"), updateAvatar)
router.route("/cover-image").patch(verifyjwt, upload.single("coverImage"), updateCoverImage)

router.route("/c/:username").get(verifyjwt, userProfile)
router.route("/history").get(verifyjwt, getUserWatchHistory)

export default router