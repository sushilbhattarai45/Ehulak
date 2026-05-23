import express from "express";
const emailRouter = express.Router();

import {
  getDLQEmails,
  processEmail,
  getSentEmails,
  getEmailEvents,
  getEmailEventById,
} from "../controllers/emailController.js";

emailRouter.post("/processEmail", processEmail);

emailRouter.get("/getDLQEmails", getDLQEmails);

emailRouter.get("/getSentEmails", getSentEmails);

emailRouter.get("/getEmailEvents", getEmailEvents);

emailRouter.get("/getEmailEvent/:id", getEmailEventById);

export default emailRouter;
