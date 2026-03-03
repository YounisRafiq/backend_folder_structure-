import { Handler } from "../utils/Handler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new apiError(500, "Failed to generate Access and Refresh tokens");
  }
};

const registeruser = Handler(async (req, res) => {
  const { email, password, fullName, username } = req.body;

  if (
    [email, password, fullName, username].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All Fields are Required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new apiError(400, "User Already Exists with this email or username");
  }

  let avatarLocalFile = req.files?.avatar?.[0]?.path;
  let coverImageLocalFile;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFile = req.files.coverImage[0].path;
  }

  if (!avatarLocalFile) {
    throw new apiError(400, "Avatar is Required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFile);
  const coverImage = await uploadOnCloudinary(coverImageLocalFile);

  if (!avatar) {
    throw new apiError(500, "Failed to upload avatar");
  }
  console.log("Avatar Uploaded to Cloudinary:", avatar);
  console.log("Cover Image Uploaded to Cloudinary:", coverImage);

  const user = await User.create({
    fullName,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
    password,
    username: username.toLowerCase(),
    email,
  });

  console.log("User Created:", user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new apiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User Registered Successfully"));
});

const loginUser = Handler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!(email || password)) {
    throw new apiError(400, "Email and Password are Required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new apiError(401, "Invalid Credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const LoggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: LoggedInUser, accessToken, refreshToken },
        "User Logged In SuccessFully",
      ),
    );
});

const logoutUser = Handler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, "User Logged Out Successfully"));
});

const refreshToken = Handler(async (req, res) => {
  const IncommingToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!IncommingToken) {
    throw new apiError(401, "Refresh Token Not Found");
  }

  try {
    const decodedToken = jwt.verify(
      IncommingToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiError(401, "User NOT Found");
    }

    if (IncommingToken !== decodedToken) {
      throw new apiError(401, "Token Mismatch");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
    );

    res
      .status(200)
      .json(
        new apiResponse(
          200,
          "AccessToken",
          accessToken,
          options,
          "RefreshToken",
          refreshToken,
          options,
          "Token Refreshed Successfully",
        ),
      );
  } catch (error) {
    throw new apiError(401, error.message || "Invalid Refresh Token");
  }
});

const updatePassword = Handler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = User.findById(req.user._id);

  if (!user) {
    throw new apiError(404, "User Not Found");
  }

  await user.isPasswordCorrect(currentPassword);

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, user, "Password Updated Successfully"));
});

const getCurrentUser = Handler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current User Fetched Successfully"));
});

const getAccountDetails = Handler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new apiError(400, "FullName and Email are Required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    },
  ).select("-password");

  res
    .status(200)
    .json(new apiResponse(200, user, "Account Details Updated Successfully"));
});

const updateAvatar = Handler(async (req, res) => {
  const avatarLocalFile = req.file?.path;

  if (!avatarLocalFile) {
    throw new apiError(400, "Avatar Image is Missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFile);
  if (!avatar.url) {
    throw new apiError(500, "Failed to Upload Avatar Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.secure_url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar Updated Successfully"));
});

const updateCoverImage = Handler(async (req, res) => {
  const coverImageLocalFile = req.file?.path;
  if (!coverImageLocalFile) {
    throw new apiError(400, "Cover Image is Missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalFile);
  if (!coverImage.url) {
    throw new apiError(500, "Failed to Upload Cover Image");
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.secure_url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Cover Image Updated Successfully"));
});

// Now we create aggregation pipelines for subscribers and subscribed user

const getuserChannelProfile = Handler(async (req, res) => {
  const [username] = req.params;

  if (!username?.trim()) {
    throw new apiError(200, "User Not Found");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribed: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribed,
        avatar: 1,
        email: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new apiError(200, "Channel Doesn't Exist");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "User channel fetched successfully"),
    );
});

//Now we write aggregation pipelines for getting watch History

const getUserWatchHistory = Handler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: $owner,
        },
      },
    },
  ]);

  return res.status(200).json(
    new apiResponse(201), user[0] , "Watch History Fetched SuccessFully"
  )
});

export {
  registeruser,
  loginUser,
  logoutUser,
  refreshToken,
  updatePassword,
  getCurrentUser,
  getAccountDetails,
  updateAvatar,
  updateCoverImage,
  getuserChannelProfile,
  getUserWatchHistory
};
