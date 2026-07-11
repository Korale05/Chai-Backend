 


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





const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const userId = req.userId;
    const { oldPassword , newPassword } = req.body;

    const user = await users.findById(userId);

    const isCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isCorrect){
        throw new ApiError(400,"Invalid old Password !");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed Successfully !!!")
    )
})


const getCurrectUser = asyncHandler(async(req,res)=>{
   const userId = req.userId;

   const user = await users.findById(req.userId).select("-password -refreshToken");

   return res.status(200).json(
    new ApiResponse(
        200,
        user,
        "Current user fetched successfully !"
    )
   );
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const { fullname , email } = req.body;
    const userId = req.userId;

    if(!fullname || !email ){
        throw new ApiError(400,"All fields are required !");
    }

    const user = await users.findByIdAndUpdate(
        userId,
        {
            $set : {
                fullname,
                email
            }
        },
        {new : true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Account details updated successfully !!!")
    )

})

const updateUserAvtar = asyncHandler(async(req,res)=>{     
    /*
    1. Get current user
        ↓
    2. Store old public_id
            ↓
    3. Upload new avatar
            ↓
    4. Update MongoDB
            ↓
    5. Delete old avatar from Cloudinary
            ↓
    6. Return updated user
    
    */
    const avatarLocalPath = req.file?.path;
    const userId = req.userId;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file if missing !");
    }

    const user = await users.findById(userId).select("-password -refreshToken");
    const oldPublicId = user.avatar.public_id;
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(500 ,"Error  : Avatar While Uploading on cloud !");
    }
    const UpdatedUser = await users.findByIdAndUpdate(
        userId,
        {
            $set : {
                avatar : {
                    url : avatar.secure_url,
                    public_id : avatar.public_id
                }
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    if(oldPublicId){
        await deleteFromCloudinary(oldPublicId);
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,UpdatedUser,"User Updated Avatar Successfully ! !")
    );

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    /*
    1. Get current user
        ↓
    2. Store old public_id
            ↓
    3. Upload new coverImage
            ↓
    4. Update MongoDB
            ↓
    5. Delete old CoverImage from Cloudinary
            ↓
    6. Return updated user
    
    */
    
    const userId = req.userId;
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400," Cover Image File Missing !");
    }


    const user = await users.findById(userId);
    const old_public_id = user.coverImage?.public_id;

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage){
        throw new ApiError(500,"Error : CoverImage while Uploading on Cloud !");
    }

    const updatedUser = await users.findByIdAndUpdate(
        userId,
        {
            $set : {
                coverImage : {
                    url : coverImage.secure_url,
                    public_id : coverImage.public_id
                }
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    if(old_public_id){
        await deleteFromCloudinary(old_public_id);
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedUser,
            "User CoverImage Updated Successfully !"
        )
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const { username } = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"username is missing !");
    }

    const channel = await users.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },  
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subsribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {
                            $in : [req.userId?._id,"$subscribers.subscriber"]
                        },
                        then : true,
                        else : false
                    }
                }
            }
        },{
            $project : {
                fullname : 1,
                username : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1,
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel,
            "User Channel Profile"
        )
    )
})


const getWatchHistory = asyncHandler(async(req,res)=>{
    const userId = req.userId;
    const user = await users.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }   
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History Featched Successfully !"
        )
    )
})



export {  
    changeCurrentPassword,
    getCurrectUser ,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,

};                              