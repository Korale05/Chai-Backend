

import { v2 as cloudinary } from "cloudinary";

const deleteFromCloudinary = async (publicId) => {
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.log("Delete Error:", error);
    }
}

export { deleteFromCloudinary }