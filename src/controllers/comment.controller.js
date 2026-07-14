import mongoose, { mongo } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { videos } from "../models/video.model";
import { comments } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";
import { pipeline } from "stream";





const addComment = asyncHandler(async(req,res)=>{
    const userId = req.userId;

    const { videoId } = req.params;
    const { content } = req.body;
    
    if(!videoId){
        throw new ApiError(400,"Video id is not provided !");
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(404,"Video Id is wrong !");
    }
    if(content?.trim().length == 0){
        throw new ApiError(400,"Comment is not provided !");
    }

    const video = await videos.findOne({
        _id : videoId,
        isPublished: true
    });

    if(!video){
        throw new ApiError(404,"Video not found !");
    }
    
    const comment = await comments.create({
        video : videoId,
        owner : userId,
        content : content
    })
    
    await videos.findByIdAndUpdate({
        _id : videoId
    },
        {
            $inc : {
                commentCount: 1
            }
        }
    )
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            comment,
            "Comment Added Successfully !",
        )
    )
})

//DELETE /comments/:commentId
const deleteComment = asyncHandler(async(req,res)=>{
    const userId = req.userId;
    const { videoId } = req.params;
    const { commentId } = req.params;

    if(!videoId){
        throw new ApiError(400,"Video id is not provided !");
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(404,"Video Id is wrong !");
    }
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(404,"Invalid Comment ID !");
    }


    const video = await videos.findOne({
        _id : videoId,
        isPublished: true
    });

    if(!video){
        throw new ApiError(404,"Video not found !");
    }

    const deletedComment= await comments.findOneAndDelete({
        _id : commentId,
        video : videoId,
        owner : userId
    });
    if (!deletedComment) {
        throw new ApiError(404, "Comment not found");
    }
    const commentUpdate = await videos.findByIdAndUpdate(
        {
            _id : videoId
        },
        {
            $inc : {
                commentCount : -1
            }
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deleteCommentID,
            "Comment Deleted Successfully !"
        )
    )
})

//getcomments using pagination 
//GET /videos/123/comments?page=5&limit=20
const getcomments = asyncHandler(async(req,res)=>{

    const { videoId } = req.params;

    let { page = 1 , limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid Video Id");
    }
    
    const video = await videos.findOne({
        _id: videoId,
        isPublished: true
    });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const totalComments = await comments.countDocuments({
        video : videoId
    });

    const allComments = await comments.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },{
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
        },{
            $addFields : {
                owner : {
                    $first : "$owner"
                }
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        },
        {
            $skip : (page - 1)* limit
        },
        {
            $limit : limit
        },
        {
            $project : {
                content : 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                comments : allComments,
                page,
                limit,
                totalComments,
                totalPages : Math.ceil(totalComments/limit),
                hasNextPage: page < Math.ceil(totalComments / limit),
                hasPrevPage : page > 1
            },
            "Comment Featched Successfully !"
        )
    )
})
