
import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
    destination : function(req,file,cb){
        cb(null,"./public/temp");
    },
    filename : function (req,file,cb){
         // Never trust or reuse the original filename directly on disk —
        // two users could upload "resume.pdf" and overwrite each other.

        const uniqueSuffix = crypto.randomBytes(16).toString("hex");
        const ext = path.extname(file.originalname);
        cb(null,`${uniqueSuffix}${ext}`);
    },
})

export const upload = multer({
    storage,
});