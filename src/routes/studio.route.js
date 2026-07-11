
import { Router } from "express";
import { VerifyJWT } from "../middlewares/auth.middlewares.js";
import { deleteVideo, getVideos, togglePublishStatus, updateVideo, UploadVideo } from "../controllers/studio.controller.js";




const router = Router();


app.use(VerifyJWT());
router.post("/upload-video",UploadVideo);
router.get("/:videoId",getVideos);
router.patch("/:videoId",updateVideo);
router.delete("/:videoId",deleteVideo);
router.patch("/:videoId/publish",togglePublishStatus);



export { router };