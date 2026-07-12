import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";



const toggleSubscription = asyncHandler(async(req,res)=>{

    const { videoId } = req.params;
    const userId = req.userId;

    
})