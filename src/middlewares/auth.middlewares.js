
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const VerifyJWT = asyncHandler(async(req,res,next)=>{

    const token = req.cookies?.accessToken || req.header("Authorization")?.split(' ')[1];

    if(!token){
        throw new ApiError(401,"Unauthorized request ");
    }

    jwt.verify(token,process.env.JWT_ACCESS_SECRET,(err,decode)=>{
        if(err){
            throw new ApiError(401,"Invalid or expired token");
        }
        req.userId = decode._id;
        next();
    }) 
})