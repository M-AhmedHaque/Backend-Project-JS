import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if(!content){
        throw new apiError(400,"All fields required.")
    }
    const user = req.body.user
    const tweetObject = await Tweet.create({
        content,
        user
    })

    return res
    .status(200)
    .json(
        new apiResponse(200,tweetObject,"Tweet made.")
    )
})

//router.route("/user/:userId").get(getUserTweets);
const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    //route aesa kia ha ke samjho hitesh ka page khola hoa tu community wala button aik link hoga jismay hitesh ki id aye gi backend par takay oski ID ki jo tweet hain wo display kardo iskay liye params ka priokh karen gay
    const {userId} = req.params.userId
    if(!tweets){
        return req.status(500).json(new apiResponse(500,{},"Invalid request."))
    }
    //now find tweets of this id
    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner:mongoose.Types.ObjectId(userId)
            }
        }
    ])
    if(!tweets){
        return req.status(500).json(new apiResponse(500,{},"Nothing to show."))
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,tweets,"Returning tweets of user.")
    )
})

//router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);
const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {new:true})
    if(!updatedTweet){
        throw new apiError(500,"internal server error")
    }
    return res
    .status(200)
    .json(
        new apiResponse(200,updatedTweet,"Tweet updated")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const deleteStatus = await Tweet.findByIdAndDelete(tweetId);
    if (!deleteStatus) {
        throw new apiError(500, "Internal server error");
    }

    return res.status(200).json(new apiResponse(200, {}, "Tweet deleted"));
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}