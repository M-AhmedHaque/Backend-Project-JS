
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloud} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // // TODO: get video, upload to cloudinary, create video
    if([title,description].some((field)=> field?.trim==='')){
        throw new apiError(400,"Title and description are required")
    }
    const videoPath = req.file?.video?.path
    const thumbnailPath = req.file?.thumbnail?.path
    if(!videoPath ){
        throw new apiError(401,"Video path not found")
    }
    if(!thumbnailPath ){
        throw new apiError(401,"thumbnail path not found")
    }

    const uploadedVideo = uploadOnCloud(videoPath)
    const uploadedThumbnail =uploadOnCloud(thumbnailPath)
    if(!uploadedVideo.url){
        throw new apiError(500,"Cannot get url of video from cloudinary")
    }
    if(!uploadedThumbnail.url){
        throw new apiError(500,"Cannot get url of thummnail from cloudinary")
    }
    const videoObject = await Video.create({
        videoFile:uploadedVideo?.url,
        thumbnail:uploadedThumbnail?.url,
        owner:req.user._id,
        title:title,
        description:description,
        duration:uploadedVideo.duration,
        views:0,
        isPublished:true
    })
    if(!videoObject){
        throw new apiError(500,"Cannot create video object")
    }
    return res
    .status(200)
    .json(
        new apiResponse(200,videoObject,"Video uploaded successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const videoObject = await Video.findById(videoId)
    if(!videoObject){
        throw new apiError(400,"Video doesnot exist")
    }
    return res.status(200).json(
        new apiResponse(200,videoObject,"Video fetched by ID")
    )
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} =req.body
    const { thumbnail}=req.file?.thumbnail?.path
    if(!title || !description || !thumbnail){
        return new apiError(400,"All fields are required.")
    }
    //upload new thumbnail on cloud
    const newCloundinaryThumbnail= uploadOnCloud(thumbnail)
    if(!newCloundinaryThumbnail){
        throw new apiError(500,"Cannot upload on cloudinary")
    }
    //get video object from mdb
    const videoObject = await Video.findById(videoId)
    if(!videoObject){
        throw new apiError(500,"Cannot find video object")
    }
    //get cloud url for deleting old thumbnail
    const oldCloudinaryUrlOfThumbnail = videoObject.thumbnail
    if(!oldCloudinaryUrlOfThumbnail){
        throw new apiError(500,"Cannot get old url from cloudinary")
    }
    //update information
    videoObject.title = title
    videoObject.description = description
    videoObject.thumbnail = newCloundinaryThumbnail.url
    //delete old thumbnail from cloud
    if (oldCloudinaryUrlOfThumbnail) {
        const publicId = oldCloudinaryUrlOfThumbnail.split('/').pop().split('.')[0];
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
                console.error("Failed to delete old avatar from Cloudinary:", error);
            }
        });
    }
    //TODO: update video details like title, description, thumbnail

}) 

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new apiError(400,"Cannot get video ID for deletion.")
    }
    const videoObject = await Video.findById(videoId)
    const cloudurlOfVideo = videoObject.videoFile
    if(req.user._id.toString() === videoObject.owner.toString()){
        // Extract the public_id from the Cloudinary URL
        const publicId = cloudurlOfVideo.split('/').pop().split('.')[0];

        // Delete the video from Cloudinary
        cloudinary.uploader.destroy(publicId, async (error, result) => {
            if (error) {
                throw new apiError(500, "Failed to delete video from Cloudinary.");
            }
        
            await videoObject.remove()

            return res
            .status(200)
            .json(
                new apiResponse(200,{},"Video deleted successfully")
                )
            })
    }else{
        return res
        .status(400)
        .json(
            new apiResponse(400,{},"Only owner can delete the video")
        )
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //not storing coz it is just for the update
    const videoObject = await Video.findById(videoId)
    if(!videoObject){
        throw new apiError(500,"Video not found")
    }
    if (videoObject.isPublished===false) {
        videoObject.isPublished=true
    }else{
        videoObject.isPublished=false
    }
    await videoObject.save({validateBeforeSave:false})
  
    return res
    .status(200)
    .json(
        new apiResponse(200,{},"Status of isPublished changed.")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
