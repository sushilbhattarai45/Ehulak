// the function of the file is to intercept every send email
// request and check if the user is authenticated and
//  has a valid API key before allowing the
// request to proceed to the email controller.
import crypto from "crypto";
import jwt from "jsonwebtoken";
import ApiKeyModel from "../models/apiKeyModel.js";
import redisConfig from "../config/redisConfig.js";
export const emailMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    console.log("Received API key in emailMiddleware:", apiKey);
    if (!apiKey) {
      return res
        .status(401)
        .json({ success: false, message: "API key missing" });
    }
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    console.log("Hashed API key in emailMiddleware:", keyHash);
   
    const cachedKey = await redisConfig.get(`apiKey:${keyHash}`);
    if (cachedKey) {
      const cachedData = JSON.parse(cachedKey);
      if (!cachedData.isActive) {
        return res
          .status(401)
          .json({ success: false, message: "API key is not active" });
      }
      console.log("API key found in Redis cache, proceeding to email controller");
      req.user = { userId: cachedData.userId }; 
      return next();
    }

    
    const apiKeyRecord = await ApiKeyModel.findOne({ keyHash: keyHash });
    console.log("API key record found in database:", apiKeyRecord);

    if (!apiKeyRecord || !apiKeyRecord.userId) {
      //check if the API key is valid
      return res
        .status(401)
        .json({ success: false, message: "Invalid API key" });
    }
    if (!apiKeyRecord.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "API key is not active" });
    }
    console.log("API key is valid, proceeding to email controller");
    next();
  } catch (error) {
    console.error("Error in emailMiddleware:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
