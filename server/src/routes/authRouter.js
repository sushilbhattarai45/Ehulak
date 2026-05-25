import express from "express";
const authRouter = express.Router();
import { createOTP, login,refreshToken, registerUser,updateUser, validateOTP} from "../controllers/authController.js";

authRouter.post("/login", login);
authRouter.post("/refreshToken", refreshToken);

authRouter.post("/register", registerUser);

authRouter.post("/updateUser", updateUser);


authRouter.post("/generateOtp", createOTP);
authRouter.post("/validateOtp", validateOTP)

export default authRouter;

