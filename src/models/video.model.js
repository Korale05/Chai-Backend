import mongoose from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videosSchema = new mongoose.Schema(
    {
        videoFile : {
            type : String, //cloudinary url
            required : true,
        },
        thumbnail : {
            type : String,
            required : true
        },
        Title : {
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