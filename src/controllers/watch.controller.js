import mongoose from "mongoose";
import { videos } from "../models/video.model";
import { asyncHandler } from "../utils/asyncHandler";
import { users } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/ApiResponse";



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
        },{
            $addFields : {
                owner : {
                    $first : "$owner"
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
                likes: 1,
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


export {
    WatchVideoById
}