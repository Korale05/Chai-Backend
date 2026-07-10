
import { Router } from "express";
import { regieterUser , loginUser , logoutUser , refreshAccessToken } from "../controllers/user.controller.js"
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


export default router;