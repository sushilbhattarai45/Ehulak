import express from "express";
const authRouter = express.Router();
import { login,refreshToken, registerUser,updateUser} from "../controllers/authController.js";

authRouter.post("/login", login);
authRouter.post("/refreshToken", refreshToken);

authRouter.post("/register", registerUser);

authRouter.post("/updateUser", updateUser);


export default authRouter;

