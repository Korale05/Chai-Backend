
import { Router } from "express";

import { 
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
import jwt  from "jsonwebtoken";


const router = Router();

router.use(VerifyJWT());
// secured routes
router.post("/change-password",changeCurrentPassword);

router.get("/current-user",getCurrectUser);

router.post("/update-account",updateAccountDetails);

router.post("/update-avatar",upload.single("avatar"),updateUserAvtar);

router.post("/cover-image",upload.single("coverImage"),updateUserCoverImage);

router.get("/c/:username",getUserChannelProfile);

router.get("/history",getWatchHistory);



export default router;