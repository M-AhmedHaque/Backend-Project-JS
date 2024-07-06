import { asyncHandle } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloud} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"

const generateAccessAndRefreshToken = async (userId)=>{
    try{
        const user = await User.findOne(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        user.refreshToken=refreshToken
        user.save({
            validateBeforeSave:false
        })
        return {refreshToken , accessToken}
    }catch(error){
        throw new apiError(200,"Something went wrong with refresh and access token")
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

export {
    registerUser,
    loginUser,
    logoutUser
}