import { asyncHandle } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloud} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"
const registerUser= asyncHandle ( async (req,res) =>{
    res.status(200).json({
        message:"ok"
    })
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
    const userExist = User.findOne({
        $or:[{ username } , { email }]
    })
    if(userExist){
        throw new apiError(408,"Email or username already exists.")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
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


export {registerUser}