import { apiError } from "../utils/apiError";
import { asyncHandle } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model"
export const verifyjwt = asyncHandle(async (req,res,next)=>{
    try {
        token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new apiError(500,"Uauthorized request.Problem with token")
        }
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new apiError(401,"Invalid Access token")
        }
        req.user=user
        next()
    } catch (error) {
        throw new apiError(401,error?.message||"Invalid access token")
    }

} )
