 


import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { users } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnairy.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const regieterUser = asyncHandler(async (req,res)=>{
        // get user details from frontend
        // validation - not empty
        // check if use already exits : username , email
        // check for images , check for avatar
        // upload them to cloudinary , avatar
        //create user object - create entry in db
        //remove password and refresh token field from responce 

        const {fullname , email, username , password } = req.body;     

        if(!fullname || !email || !username || !password ){
            throw new ApiError(400,"fullname , email , username and password  are required'")
        }

        console.log("step 1");

        const existeduser = await users.findOne({
            $or : [ { username } , { email }]
        })

        console.log("step 2");
        if(existeduser){
            throw new ApiError(409 , "User with email or username already exits !!!!");
        }
        
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

        if(!avatarLocalPath) throw new ApiError(400,"Avatar file is required from user !");

        console.log("step 3");

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        let coverImage = null;

        if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
        }

        if(!avatar){
            throw new ApiError(500,"Failed to upload avatar to Cloudinary.");
        }
        if(!coverImage && coverImageLocalPath){
            throw new ApiError(500,"Failed to upload coverImage to Cloudinary.");
        }

        console.log("step 4");

        const user = await users.create({
            fullname,
            avatar : avatar.url,
            coverImage : coverImage ? coverImage.url : "" ,
            email,
            password,
            username : username.toLowerCase()
        })
        
        console.log("step 5");

        const isadded = await users.findById(user._id)
        .select("-password -refreshToken");

        if(!isadded){
            throw new ApiError(500,`Something went wrong 
                    while registering the user in DB !`);
        }

        console.log("step 6");

        return res.status(201).json(
            new ApiResponse(200,isadded,"User Registered successfully !")
        );      

    }
)


export {regieterUser };