import express from "express";
const credsRouter = express.Router();


import { createAPIKey ,getAPiKeyForUser, deleteAPIKey, disableAPIKey}
 from "../controllers/credsController.js";

credsRouter.post("/createApiKey", createAPIKey);
credsRouter.get("/getApiKeyForUser", getAPiKeyForUser);
credsRouter.post("/deleteApiKey", deleteAPIKey);
credsRouter.post("/disableApiKey", disableAPIKey);

export default credsRouter;