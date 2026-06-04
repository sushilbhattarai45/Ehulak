import express from "express";
const emailRouter = express.Router();

import {
  getDLQEmails,
  processEmail,
  getSentEmails,
  getEmailEvents,
  getEmailEventById,
} from "../controllers/emailController.js";
import { rateLimitMiddleware } from "../middlewares/rateLimitMiddleware.js";
import { emailMiddleware } from "../middlewares/emailMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";  
emailRouter.post("/processEmail", emailMiddleware, processEmail);

emailRouter.get("/getDLQEmails", authMiddleware, getDLQEmails);

emailRouter.get("/getSentEmails", authMiddleware, getSentEmails);

emailRouter.get("/getEmailEvents", authMiddleware, getEmailEvents);

emailRouter.get("/getEmailEvent/:id", authMiddleware, getEmailEventById);

export default emailRouter;
