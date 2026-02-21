import { Router } from "express";
import { registeruser } from "../controllers/user.controller.js";
import { loginUser } from "../controllers/login.controller.js";
const router = Router();
 
router.route('/register').post(registeruser);
router.route('/login').post(loginUser);

export default router;