
import { Router } from "express";
import { WatchVideoById } from "../controllers/watch.controller";




const router = Router();


router.get("/?videoId",WatchVideoById);


export default router;