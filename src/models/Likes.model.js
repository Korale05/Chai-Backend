
import mongoose from "mongoose";


const LikeSchema = new mongoose.Schema(
    {
        user : {
            type : mongoose.Types.ObjectId,
            ref : "users",
            required : true
        },
        video : {
            type : mongoose.Types.ObjectId,
            ref : "videos",
            required : true
        }
    },{
        timestamps : true
    }
)

LikeSchema.index(
    { user : 1 , video : 1},
    {unique : true}
)

export const likes = mongoose.model("likes",LikeSchema);