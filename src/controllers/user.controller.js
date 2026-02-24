import { Handler } from "../utils/Handler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registeruser = Handler( async (req , res) => {
    const { email , password , fullName , username } = req.body;

    if([email , password , fullName , username].some((field) => field?.trim() === "")){
        throw new apiError(400 , "All Fields are Required");
    }

    const existingUser = await User.findOne({
      $or : [
        { email},
        { username}
      ]
    })

    if(existingUser){
        throw new apiError(400 , "User Already Exists with this email or username");
    }
    

   let avatarLocalFile = req.files?.avatar?.[0]?.path;
    let coverImageLocalFile;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalFile = req.files.coverImage[0].path;
    }

    if(!avatarLocalFile){
      throw new apiError(400 , "Avatar is Required");
    }

    const avatar =  await uploadOnCloudinary(avatarLocalFile);
    const coverImage =  await uploadOnCloudinary(coverImageLocalFile);

    if(!avatar){
        throw new apiError(500 , "Failed to upload avatar");
    }
    console.log("Avatar Uploaded to Cloudinary:", avatar);
    console.log("Cover Image Uploaded to Cloudinary:", coverImage);

 const user = await User.create({
    fullName,
    avatar : avatar.secure_url,
    coverImage : coverImage?.secure_url||"",
    password,
    username : username.toLowerCase(),
    email,
  });

 const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
 )
 if(!createdUser){
    throw new apiError(500 , "Something went wrong while creating user");
 }

 return res.status(201).json(
  new apiResponse(201 , createdUser , "User Registered Successfully")
 )
});
export { registeruser };
