import mongoose from "mongoose";
import { videos } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { users } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { likes } from "../models/Likes.model.js"


const WatchVideoById = asyncHandler(async(req,res)=>{
    const { videoId } = req.params;
    const userId = req.userId;

    if(!videoId){
        throw new ApiError(400,"Video id is not provided !");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }


    const watchVideo = await videos.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(videoId),
                isPublished: true 
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $lookup : {
                            from : "subscriptions",
                            localField : "_id",
                            foreignField : "channel",
                            as : "subscribers"
                        }
                    },
                    {
                        $addFields : {
                            subscribersCount : {
                                $size : "$subscribers"
                            },
                            isSubscribed : {
                                $cond : {
                                    if : {
                                        $in : [
                                            new mongoose.Types.ObjectId(userId)
                                            ,"$subscribers.subscriber"
                                        ]
                                    }
                                }
                            }
                        }
                    },{
                        $project : {
                            fullname : 1,
                            username : 1,
                            avatar : 1,
                            coverImage : 1,
                            subscribersCount : 1,
                            isSubscribed : 1
                        }
                    }
                ]
            }
        },
        {
            $lookup : {
                from :  "likes",
                localField : "_id",
                foreignField : "video",
                as : "likes"
            }
        },
        {
            $addFields : {
                owner : {
                    $first : "$owner"
                },
                likesCount : {
                    $size : "$likes"
                },
                isLiked : {
                    $in : [
                        new mongoose.Types.ObjectId(userId),
                        "$likes.user"
                    ]
                }
            }
        },
        {
            $project : {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                likesCount: 1,
                commentCount: 1,
                createdAt: 1,
                owner: 1
            }
        }

    ]);

    if (!watchVideo.length) {
        throw new ApiError(404, "Video not found!");
    }

    const video = watchVideo[0];
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video watched successfully send to you !"
        )
    )
})

const likedVideo = asyncHandler(async(req,res)=>{
    
    const { videoId } = req.params;
    const userId = req.userId;

    if( !mongoose.Types.ObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id!");
    }

    const video = await videos.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video not found !");
    }


    const liked = likes.findById({
        user : userId,
        video : videoId
    })
    if(liked){
        await likes.findByIdAndDelete(liked._id);

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    liked : "false"
                },
                "Video is unliked Successfully !"
            )
        )
    }
    

    await likes.create(
        {
            user : userId,
            video : videoId
        }
    );
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                liked : true
            },
            "Liked Video is Added !"
        )
    )

})

// comment add comment edit commment delte comment

export {
    WatchVideoById
}