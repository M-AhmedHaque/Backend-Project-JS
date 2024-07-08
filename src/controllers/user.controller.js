import { asyncHandle } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloud} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"
import { JsonWebTokenError } from "jsonwebtoken"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId)=>{
    try{
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {refreshToken , accessToken}
    }catch(error){
        throw new apiError(200,"Something went wrong with refresh and access token while genearation")
    }
}

const registerUser= asyncHandle ( async (req,res) =>{
    //time to write proper logic haaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    const {fullname , username , email, password } = req.body
    console.log("name:",fullname)
    //validate : empty
    if(
        [fullname , username , email, password].some((field)=> field?.trim === "")
        
    ){
        throw new apiError(400,"All fields required.")
    }// }else{
    //     console.log("name:",fullname)
    // }
    const userExist = await User.findOne({
        $or:[{ username } , { email }]
    })
    if(userExist){
        throw new apiError(408,"Email or username already exists.")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
        coverImageLocalPath=req.files.coverImage[0].path
    }
 
    if(!avatarLocalPath){
        throw new apiError(400,"Cant get path of Avatar.")
    }
    const avatar = await uploadOnCloud(avatarLocalPath) 
    const coverImage = await uploadOnCloud(coverImageLocalPath) 
    if(!avatar){
        throw new apiError(400,"Cant upload Avatar on cloudinary.")
    }
    
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
    })
    const userCreated = await User.findById(user._id).select("-password -refreshToken")
    if(!userCreated){
        throw new apiError(500,"Something went wrong.")
    }
    return res.status(201).json(
        new apiResponse(200,userCreated,"user created successfully")
    )
})

const loginUser = asyncHandle ( async(req, res) =>{
    const {username , email , password}=req.body

    if(!username && !email){
        throw new apiError(400,"username or email required")
    }
    const user = await User.findOne({
        $or:[ {username} , {email} ]
    })
    if(!user){
        throw new apiError(404,"invalide username or password")
    }
    const passwordCorrect= await user.isPasswordCorrect(password)
    if(!passwordCorrect){
        throw new apiError(402,"Invalid password")
    }
    //console.log(user._id)
    const {refreshToken , accessToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true  
    }
    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(
        new apiResponse(
            200,
            {
                user:loggedInUser,refreshToken,accessToken
            },
            "User logged in successfully"
        )
    )
})
const logoutUser = asyncHandle( async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new apiResponse(200,{},"User logged out")
    )
})

const refreshAccessToken = asyncHandle( async (req,res) =>{
    try {
        const encodedToken = req.cookies.refreshToken || req.body.refreshToken
        if(!encodedToken){
            throw new apiError(401,"Unauthorized request. Invalid refresh token")
        }
        const decodedToken = jwt.verify(encodedToken , process.env.REFRESH_TOKEN_SECRET)
        if(!decodedToken){
            throw new apiError(402,"cannot decode refresh token")
        }
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new apiError(401,"Invalid refresh token")
        }
        if(encodedToken !== user?.refreshToken){
            throw new apiError(400,"Refresh token ecxpired or already used.")
        }
        const {newRefreshToken , accessToken} = generateAccessAndRefreshToken(user._id)
        const options = {
            httpOnly:true,
            secure:true
        }
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new apiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access and refresh token refreshed")
        )
    } catch (error) {
        throw new apiError(400,"Something went while refreshing token")   
    }
} )

const changePassword = asyncHandle( async (req, res)=>{
    const user = User.findById(req.user?._id)
    const {currentPassword , newPassword } = req.body
    if(!currentPassword || !newPassword){
        throw new apiError(400,"Enter both fields")
    }
    const isPasswordCorrect = user.isPasswordCorrect(currentPassword)
    if(!isPasswordCorrect){
        throw new apiError(400,"Wrong password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(
        new apiResponse(200,{},"Password changed")
    )
})
const getUser = asyncHandle( async (req,res,next) =>{
    return res
    .status(200)
    .json(
        new apiResponse(200,req.user,"User returned as response")
    )
} )

const updateUsernameAndEmail = asyncHandle(async (req,res) =>{
    const {fullname ,email }=req.body
    if(!username || !email){
        return new apiError(400 , "All fields required")
    }
    const user =await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                fullname:fullname, //agar key aur value sem hotu tu sirf aik likh saktay
                email:email
            }
        },
        {save:true}
    ).select("-password")
    return res
    .status(200)
    .json(200,user,"email and fullname updated")

})
const updateAvatar = asyncHandle(async (req,res)=>{
    const avatarPath = req.file?.avatar.path
    if(!avatarPath){
        return new apiError(400,"Avatar path not found")
    }
    const avatarURL = await uploadOnCloud(avatarPath)
    if(!avatarURL.url){
        return new apiError(400,"Problem in uploading on cloud")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{ 
                avatar:avatarURL.url
            }
        },
        {save:true}
    ).select("-passwaord")
    return res
    .status(200)
    .json(
        new apiResponse(200,user,"Avatar changed successfully")
    )

})
const updateCoverImage = asyncHandle(async (req,res)=>{
    const coverImagePath = req.file?.avatar.path
    if(!coverImagePath){
        return new apiError(400,"Cover image path not found")
    }
    const coverImageURL = await uploadOnCloud(coverImagePath)
    if(!coverImageURL.url){
        return new apiError(400,"Problem in uploading cover image on cloud")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImageURL.url
            }
        },
        {save:true}
    ).select("-passwaord")
    return res
    .status(200)
    .json(
        new apiResponse(200,user,"Cover image changed successfully")
    )
    
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateUsernameAndEmail,
    updateCoverImage,
    updateAvatar
}