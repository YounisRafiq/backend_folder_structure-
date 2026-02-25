import { Handler } from "../utils/Handler";
import { apiError } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import User from '../models/user.model.js';

export const verifyJWT = Handler(async (req , res , next) => {

 try {
 const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") || req.header("authorization")?.replace("Bearer ", "");

  if(!token){
    throw new apiError(401 , "Unauthorized");
}

const decoded = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET) ;  

const user = User.findById(decoded?._id).select("-password -refreshToken");

if(!user){
    throw new apiError(401 , "Invlid access token");
}

req.user = user;
next();

 } catch(error) {
   throw new apiError(401 , error?.message || "Invalid access token");
 }
})

