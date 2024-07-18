import mongoose,{Schema} from "mongoose";
const subcriptionSChema = new Schema({
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})
export const Subscription = mongoose.model("Subscription",subcriptionSChema)
