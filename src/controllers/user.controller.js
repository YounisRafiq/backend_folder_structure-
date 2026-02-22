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

    const avatarLocalFile = req.files?.avartar[0]?.path;
    const coverLocalFile = req.files?.avartar[0]?.path;

    if(!avatarLocalFile){
      throw new apiError(400 , "Avatar is Required");
    }

const avatar =  await uploadOnCloudinary(avatarLocalFile);
const coverImage =  await uploadOnCloudinary(coverLocalFile);

  if(!avatar){
    throw new apiError(500 , "Failed to upload avatar image");
  };

 const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url||"",
    password,
    username : username.toLowerCase(),
    email,
  });

 const createdUser = await User.findById(user._id).select(
  "-password --refreshToken"
 )
 if(!createdUser){
    throw new apiError(500 , "Something went wrong while creating user");
 }

 return res.status(201).json(
  new apiResponse(201 , createdUser , "User Registered Successfully")
 )
});
export { registeruser };
