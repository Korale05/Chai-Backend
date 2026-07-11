import mongoose from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videosSchema = new mongoose.Schema(
    {
        videoFile : {
            url : String,
            public_id : String,
            duration : Number,
        },
        thumbnail : {
            url : String,
            public_id : String
        },
        title : {
            type : String,
            required : true
        },
        description : {
            type : String,
            required : true
        },
        duration : {
            type : Number,
            required : true
        },
        views : {
            type : Number,
            default : 0
        },
        likes : {
            type : Number,
            default : 0
        },
        commentCount : {
            type : Number ,
            default : 0
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "users"
        }
    },
    {timestamps : true});


videosSchema.plugin(mongooseAggregatePaginate);

export const videos = mongoose.model("videos",videosSchema);