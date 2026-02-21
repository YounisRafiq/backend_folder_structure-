import { Handler } from "../utils/Handler.js";;

const loginUser = Handler(async (req , res) => {
    res.status(200).json({
        success : true,
        message : "User Logged In Successfully"
    })
});

export { loginUser };
