import express from "express";
const credsRouter = express.Router();


import { createAPIKey ,getAPiKeyForUser} from "../controllers/credsController.js";

credsRouter.post("/createApiKey", createAPIKey);
credsRouter.get("/getApiKeyForUser", getAPiKeyForUser);

export default credsRouter;