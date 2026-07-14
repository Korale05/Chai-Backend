import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { videos } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { subscriptions } from "../models/subscription.model.js"



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


/* 
Pagination position
Match
↓

Lookup
↓

AddFields
↓

Skip
↓

Limit
↓

ReplaceRoot
*/

//GET /subscriptions/me/subscribed
const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const userId = req.userId;

    let { page = 1 , limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const subscirbedChannel = await subscriptions.aggregate([
        {
            $match : {
                subscriber : userId
            },
        },{
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channelinfo",
                pipeline : [
                    {
                        $lookup : {
                            from : "subscriptions",
                            localField : "_id",
                            foreignField : "channel",
                            as : "subscribers"
                        }
                    },{
                        $addFields : {
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
            $addFields : {
                channelinfo : {
                    $first : "$channelinfo"
                }
            }
        },
        {
            $skip : (page - 1)*limit
        },
        {
            $limit : limit
        },
        {
            $replaceRoot : {
                newroot : "$channelinfo"
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscirbedChannel ,
            "Subscribed Channel List is given !"
        )
    )
})

const getSubscribersList = asyncHandler(async(req,res)=>{
    const userId = req.userId;

    let { page = 1,limit = 10} = req.query;
    page = Number(page);
    limit = Number(limit);

    const subscribersList = await subscriptions.aggregate([
        {
            $match : {
                channel : userId
            }
        },{
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "Subscribers",
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
        },{
            $addFields : {
                Subscribers : {
                    $first : "$Subscribers"
                }
            }
        },{
            $skip : (page -1)*limit
        },{
            $limit : limit
        },{
            $replaceRoot : {
                newRoot : "$Subscribers"
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                subscribersList,
                page,
                limit,
            }
        )
    )
})