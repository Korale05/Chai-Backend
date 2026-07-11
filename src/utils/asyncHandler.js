
//using try and catch

const asyncHandler = (fn) => async (req,res,next) =>{
    try{
        await fn(req,res,next);
    }catch(error){
        console.error("FULL ERROR:");
        console.error(error);
        
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message,
            errors : error.errors || []
        });
    }
};

export { asyncHandler };