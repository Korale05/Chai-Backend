

import { v2 as cloudinary } from "cloudinary";

const deleteFromCloudinary = async (publicId,resourceType = "image") => {
    try {
        return await cloudinary.uploader.destroy(publicId,{
            resource_type : resourceType
        });
    } catch (error) {
        console.log("Delete Error:", error);
    }
}

export { deleteFromCloudinary }