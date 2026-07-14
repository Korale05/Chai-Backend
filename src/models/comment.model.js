import mongoose from "mongoose";


const commentSchema = mongoose.Schema({
    
    video : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "video",
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "users",
        required : true
    },
    content : {
        type : String,
        required : true,
        trim : true
    }
},{timestamps : true});

export const comments = mongoose.model("comments",commentSchema);