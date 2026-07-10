
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const usersSchema = new mongoose.Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
        },
        fullname : {
            type : String,
            required : true,
            trim : true,
        },
        avatar : {
            type : String, // cloudinary url
            required : true
        },
        coverImage : {
            type : String
        },
        watchHistory : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "videos"
            }
        ],
        password : {
            type : String,
            required : [true , "Password is required!!!"],
        },
         : {
            type : String,
        }

    },
    {timestamps : true});


//hooks of mongodb
usersSchema.pre("save",async function () {
    if(this.isModified("password"))
        this.password = await bcrypt.hash(this.password,10);

})


usersSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password);
}

usersSchema.methods.generateAccessToken = function (){
    return jwt.sign(
       {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
       },
       process.env.JWT_ACCESS_SECRET,
       {
        expiresIn : '30m'
       }
    );
}


usersSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
       {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
       },
       process.env.JWT_REFRESH_SECRET,
       {
        expiresIn : '7d'
       }
    );
}

export const users = mongoose.model("users",usersSchema);