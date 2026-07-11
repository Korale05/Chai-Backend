
import { v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { loadEnvFile } from "process";



// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary =  async(localFilePath)=>{
    try{
        if(!localFilePath)return null;

        //upload the file one cloudnariy
        const responce = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        });
        
        fs.unlinkSync(localFilePath);
        
        //file has been uploaded successfully 
        console.log("File is uploaded on cloudinary !",responce.url);

        return responce;

    }catch(error){
        console.log("Cloudinary Error : ");
        console.log(error);
        if(localFilePath && fs.existsSync(localFilePath)){  
            fs.unlinkSync(localFilePath);
        }
        return null;
        
    }
}

export { uploadOnCloudinary };
