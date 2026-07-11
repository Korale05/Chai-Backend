
import { Router } from "express";
import { VerifyJWT } from "../middlewares/auth.middlewares.js";
import { deleteVideo, getVideos, togglePublishStatus, updateVideo, UploadVideo } from "../controllers/studio.controller.js";
import { upload } from "../middlewares/multer.middleware.js";




const router = Router();


router.use(VerifyJWT());

router.post("/",
    upload.fields([
        {
            name : "video",
            maxCount : 1
        },{
            name : "thumbnail",
            maxCount : 1
        }
    ])
    ,UploadVideo);
router.get("/:videoId",getVideos);
router.patch("/:videoId",upload.single("thumbnail"),updateVideo);
router.delete("/:videoId",deleteVideo);
router.patch("/:videoId/publish",togglePublishStatus);



export default router;