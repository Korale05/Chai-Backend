import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { videos } from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse";




const toggleSubscription = asyncHandler(async(req,res)=>{
    const { videoId } = req.params;
    const userId = req.userId;

    if(!videoId){
        throw new ApiError(400,"Video id is not provided !");
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid Video Id");
    }

    const video = await videos.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video is not found !");
    }

    if(video.owner.toString() == userId.toString()){
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const isSubscribe = await subscriptions.findOne({
        subscriber : userId,
        channel : video.owner
    });

    if(isSubscribe){
        await subscriptions.findByIdAndDelete(isSubscribe._id);
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscibed : false
                },
                "Successfuly Unsuscribed !"
            )
        );
    }

    const subscirbe = await subscriptions.create({
        subscriber : userId,
        channel : video.owner
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                subscirbed : true
            },
            "Subscribe successfully !"
        )
    );
})


//GET /subscriptions/me/subscribed
const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const userId = req.userId;

    const subscirbedChannel = await subscriptions.aggregate([
        {
            $match : {
                subscriber : userId
            },
        },{
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "channel",
                pipeline : [
                    {
                        $lookup : {
                            from : "subscriptions",
                            localField : "_id",
                            foreignField : "channel",
                            as : "subscribers"
                        }
                    },{
                        $addField : {
                            subscriberCount : {
                                $size : "$subscribers"
                            }
                        }
                    },{
                        $project : {
                            fullname : 1,
                            username : 1,
                            avatar : 1,
                            subscriberCount : 1
                        }
                    }
                ]
            },
        },{
            $addField : {
                channel : {
                    $first : "$channel"
                }
            }
        },{
            $replaceRoot: {
                newRoot: "$channel"
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {getSubscribedChannels},
            "Subscribed Channel List is given !"
        )
    )
})