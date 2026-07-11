
import { Router } from "express";

import { 
    regieterUser ,
    loginUser ,
    logoutUser , 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrectUser, 
    updateAccountDetails, 
    updateUserAvtar, 
    updateUserCoverImage , 
    getUserChannelProfile, 
    getWatchHistory
} from "../controllers/user.controller.js"

import { upload } from "../middlewares/multer.middleware.js";
import { VerifyJWT } from "../middlewares/auth.middlewares.js";


const router = Router();

router.post("/register",
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    regieterUser);

router.post("/login",loginUser)

router.post("/refresh-token",refreshAccessToken)

//secured routes
router.post("/logout",VerifyJWT,logoutUser);

router.post("/change-password",VerifyJWT,changeCurrentPassword);

router.get("/current-user",VerifyJWT,getCurrectUser);

router.post("/update-account",VerifyJWT,updateAccountDetails);

router.post("/update-avatar",VerifyJWT,upload.single("avatar"),updateUserAvtar);

router.post("/cover-image",VerifyJWT,upload.single("coverImage"),updateUserCoverImage);

router.get("/c/:username",VerifyJWT,getUserChannelProfile);

router.get("/history",VerifyJWT,getWatchHistory);



export default router;