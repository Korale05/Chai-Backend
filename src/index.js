import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDB from "./db/db.js";
import dotenv from "dotenv";

dotenv.config({
    path : './.env'
})

connectDB()