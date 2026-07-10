
    import { Router } from "express";
    import { regieterUser } from "../controllers/user.controller.js"
    import { upload } from "../middlewares/multer.middleware.js";
    const router = Router();

    router.post(
        "/register",
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


    export default router;