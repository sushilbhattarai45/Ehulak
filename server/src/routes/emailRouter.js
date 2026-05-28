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

emailRouter.post("/processEmail", rateLimitMiddleware, processEmail);

emailRouter.get("/getDLQEmails", getDLQEmails);

emailRouter.get("/getSentEmails", getSentEmails);

emailRouter.get("/getEmailEvents", getEmailEvents);

emailRouter.get("/getEmailEvent/:id", getEmailEventById);

export default emailRouter;
