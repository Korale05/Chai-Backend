import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import app from "./app.js";



dotenv.config({
    path : './.env'
})

connectDB()
.then(()=>{
    //app listen
    app.on("error",(error)=>{
        console.log("ERRR Recieved : ",error);
        throw error;
    })
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is Running ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongo db connection failded !!! ",err);
})