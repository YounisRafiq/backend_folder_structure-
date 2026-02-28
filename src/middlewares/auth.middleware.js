import { apiError } from "../utils/apiError.js";
import { Handler } from "../utils/Handler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = Handler(async (req, _, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "");
      console.log("Token from Request:", token);

    if (!token) {
      throw new apiError(401, "Token Not Found");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?._id).select("-password -refreshToken");

    if (!user) {
      throw new apiError(401, "User Not Found");
    }

    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    throw new apiError(401, "Unauthorized Request");
  }
});
