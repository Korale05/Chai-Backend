// User must be Manage their  Videos


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




const UploadVideo = asyncHandler(async(req,res)=>{
    /*
        1. get user id
        2. take video from user
        3. check file is send or not 
        4. upload on cloudinary 
        5 . updaate in mongod db
    */
    const userId = req.userId;
    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400,"Video is not given !");
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is not given !");
    }

    let videoUpload = null;
    let thumbnailUpload = null;
    try {
        // Upload both files in Parallel 
        
        [videoUpload , thumbnailUpload ] = await Promise.all([
            uploadOnCloudinary(videoLocalPath),
            uploadOnCloudinary(thumbnailLocalPath)
        ]);
    
        //Validate uploads

        if(!videoUpload?.secure_url){
            throw new ApiError(500,"Error : Video Uploading failed on Cloud !");
        }
        if(!thumbnailUpload?.secure_url){
            throw new ApiError(500,"Error : Thubmnail uploading failed on Cloud !");
        }
    
        const { title, description } = req.body;
    
        if(!title?.trim()){
            throw new ApiError(400,"Title is required !");
        }
    
        if (!description?.trim()) {
            throw new ApiError(400, "Description is required");
        }
        
        const video = await videos.create({
            videoFile : {
                url : videoUpload.secure_url,
                public_id : videoUpload.public_id,
                duration : videoUpload.duration
            },
            thumbnail : {
                url : thumbnailUpload.secure_url,
                public_id : thumbnailUpload.public_id
            },
            title : title,
            description : description ,
            duration : videoUpload.duration,
            views : 0,
            likes : 0,
            commentCount : 0,
            isPublished : true,
            owner : userId
        }) 

        return res.status(201).json(
        new ApiResponse(
            201,
            video,
            "Video uploaded successfully !"
        )
    )
    } catch (error) {
        
        // Rollback Cloudinary Uploads

        if(videoUpload?.public_id){
            await deleteFromCloudinary(videoUpload.public_id);
        }

        if(thumbnailUpload?.public_id){
            await deleteFromCloudinary(thumbnailUpload.public_id);
        }

        throw new ApiError(
            500,
            error.message
        );
    }
})


const getVideos = asyncHandler(async(req,res)=>{

    const { videoId }= req.params;
    const userId = req.userId;

    if(!videoId){
        throw new ApiError(400,"videoId must required !");
    }

    const video = await videos.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video not found !");
    }
    if(video.owner.toString() != userId.toString()){
        throw new ApiError(400,"Video is not yours !");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video featched Successfully !")
    );

});

const updateVideo = asyncHandler(async(req,res)=>{

    const { videoId } = req.params;
    const userId = req.userId;

    if(!videoId){
        throw new ApiError(400,"Video id is not provided !");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await videos.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video not found !");
    }

    if(video.owner.toString() != userId.toString()){
        throw new ApiError(404,"Video is not yours !");
    }


    const { title , description } = req?.body;

    let update = {};

    if(title)update.title = title;
    if(description)update.description = description;

    const thumbnailLocalPath = req?.file?.path;

    let old_public_id = null;
    if(thumbnailLocalPath){
        old_public_id = video?.thumbnail?.public_id;

        const updatedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if(!updatedThumbnail){
            throw new ApiError(500,"Error : Failed to Uplod the Thumbail on Cloud !");
        }

        update.thumbnail = {
            url : updatedThumbnail.secure_url,
            public_id : updatedThumbnail.public_id
        }

    }

    if(Object.keys(update).length == 0){
        throw new ApiError(400,"Nothing to Update !");
    }

    const updatedVideo = await videos.findByIdAndUpdate(videoId,
        {
            $set : update,
        },
        {new : true}
    )

    if(old_public_id){
        await deleteFromCloudinary(old_public_id);
    }

    res
    .status(200)
    .json(
        new ApiResponse(200,updatedVideo,"Video Successfully Updated !")
    )
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const { videoId } = req.params;
    const userId = req.userId;

    if(!videoId){
        throw new ApiError(400,"Video id is not provided !");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await videos.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video not found !");
    }

    if(video.owner.toString() != userId.toString()){
        throw new ApiError(403, "You are not authorized to delete this video.");    
    }

    const video_public_id = video.videoFile.public_id;
    const thumbnail_public_id = video.thumbnail.public_id;

    try {
        await deleteFromCloudinary(video_public_id);
        await deleteFromCloudinary(thumbnail_public_id);
    } catch (error) {
        throw new ApiError(500, "Failed to delete files from Cloudinary");
    }

    const deleteVideoFromDB = await videos.findOneAndDelete({
        _id : videoId,
        owner : userId
    });

    if (!deleteVideoFromDB) {
        throw new ApiError(404, "Video not found or you are not authorized.");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Video Deleted Successfully !"
        )
    )
})

const togglePublishStatus = asyncHandler(async(req,res)=>{
    const { videoId } = req.params;
    const userId = req.userId;

    const video = await videos.findOne({
        _id: videoId,
        owner: userId
    });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    await video.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Vidoe is Published Successfully !"
        )
    );
})


export {
    UploadVideo,
    getVideos,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};