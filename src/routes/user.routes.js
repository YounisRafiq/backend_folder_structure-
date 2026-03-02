import { Router } from "express";
import { getAccountDetails, getCurrentUser, getuserChannelProfile, getUserWatchHistory, loginUser, logoutUser, refreshToken, registeruser, updateAvatar, updateCoverImage, updatePassword } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
 
router.route('/register').post
(
   upload.fields([
    {
        name : "avatar" ,
        maxCount : 1
    },
    {
        name : "coverImage",
        maxCount : 1
    }
   ]),
    registeruser
);

router.route('/login').post(loginUser);

router.route('/logout').post(verifyJWT , logoutUser);

router.route('/refresh-token').post(refreshToken);

router.route('/update-password').post(verifyJWT , updatePassword);

router.route('/current-user', verifyJWT , getCurrentUser);

router.route('/update-account').patch(getAccountDetails);

router.route('/update-avatar').patch(verifyJWT , upload.single('avatar') , updateAvatar);

router.route('/update-coverImage').patch(verifyJWT , upload.single('coverImage') , updateCoverImage);

router.route('/channel/:username').get(verifyJWT ,  getuserChannelProfile);

router.route('/watch-History').get(verifyJWT , getUserWatchHistory);

export default router;