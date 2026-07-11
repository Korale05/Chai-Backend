
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { users } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnairy.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import mongoose from "mongoose";
import { videos } from "../models/video.model.js";

 const options_accessToken = {
    httpOnly : true,
    secure : true,
    sameSite : 'strict',
    maxAge : 15 * 60 * 1000, //15 min
}
const option_refreshTOken = {
    httpOnly : true,
    secure : true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

const generateAccessTokenAndRefreshToken = async(userId)=>{
    
    try{
        const user = await users.findOne({_id : userId});
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken , refreshToken };

    }catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token !");
    }
}


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
            avatar : {
                url: avatar.secure_url,
                public_id: avatar.public_id
            },
            coverImage : coverImage ? {
                url : coverImage.secure_url,
                public_id : coverImage.public_id
            } : "" ,
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

const loginUser = asyncHandler(async (req,res)=>{
    // req body ->data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // set cookies

    const { email , username , password } = req.body;

    if(!username && !email){
        throw new ApiError(400,"username or password is required !");
    }
    if(!password){
        throw new ApiError(400,"Password is required !");
    }

    const user = await users.findOne({
        $or : [ { username } , { email }]
    });

    if(!user){
        throw new ApiError(404,"User does not exits !");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(404,"Password is Wrong !");
    }

    // we came here means password is correct we can now generate tokens

    const { accessToken , refreshToken } = await 
        generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await users.findById(user._id)
        .select("-password -refreshToken");
    
   

    return res
    .status(200)
    .cookie("accessToken",accessToken,options_accessToken)
    .cookie("refreshToken",refreshToken,option_refreshTOken)
    .json(
        new ApiResponse(
            200,
            {
                loggedInUser,
                accessToken,
                refreshToken
            },
            "User loged In Successfully !"
        )
    )
})


const logoutUser = asyncHandler( async(req,res)=>{
    const userId = req.userId;

    await users.findByIdAndUpdate(
        userId,
        {
            $set : {
                refreshToken : null,
            }
        }
    );

    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(
            new ApiResponse(200, "User logged out Successfully !")
        )
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    const IncommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken ;

    if(!IncommingRefreshToken){
        throw new ApiError(401,"No refresh token provided !!");
    }

    jwt.verify( IncommingRefreshToken,process.env.JWT_REFRESH_SECRET,
        async (err,decode)=>{
            if(err){
                res
                .status(401)
                .json(
                    new ApiError(401,"Invalid or Expired Refresh Token , Login Once again !")
                )
            }


            const user = await users.findById(decode._id);

            if (!user) {
                throw new ApiError(404, "User not found");
            }

            if(user.refreshToken !== IncommingRefreshToken){
                throw new ApiError(401,"Invalid refresh token!!");
            }

            // measn it verify refres token , now  we have to generate accessToken for it once again
            const { accessToken , refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
            
            return res
            .status(200)
            .cookie("accessToken",accessToken,options_accessToken)
            .cookie("refreshToken",refreshToken,option_refreshTOken)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "AceessToken generated Successfully !",
                )
            )

        }
    )
    

})


export {
    regieterUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}