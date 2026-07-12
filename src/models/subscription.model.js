
import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
    {
        subscriber : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "users"
        },
        channel : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "users"
        },
        
    },
    {timestamps : true}
)

SubscriptionSchema.index(
    { subscriber : 1,channel : 1},
    {unique : true}
)
export const Subscription = mongoose.model("Subscription",SubscriptionSchema);