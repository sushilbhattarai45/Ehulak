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
    console.log("Received request in emailMiddleware:", req.body);
    const apiKey = req.headers["x-api-key"];
    console.log("Received API key in emailMiddleware:", apiKey);
    if (!apiKey) {
      return res
        .status(401)
        .json({ success: false, message: "API key missing" });
    }
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    console.log("Hashed API key in emailMiddleware:", keyHash);
   

//deleting
    const cachedKey = await redisConfig.get(`apiKey:${keyHash}`);
    const hourlyKey = `emailCount:${keyHash}`;
    const minuteKey = `emailCountPerMinute:${keyHash}`;
    
    // Increment counters
    const hourlyCount = await redisConfig.incr(hourlyKey);
    const minuteCount = await redisConfig.incr(minuteKey);
    
    // Set expiry only when key is first created
    if (hourlyCount === 1) {
      await redisConfig.expire(hourlyKey, 3600);
    }
    
    if (minuteCount === 1) {
      await redisConfig.expire(minuteKey, 60);
    }
    
    console.log("Hourly count:", hourlyCount);
    console.log("Minute count:", minuteCount);
    
    // Rate limits
    if (hourlyCount > 60) {
      return res.status(401).json({
        success: false,
        message: "You have reached the maximum number of emails per hour.",
      });
    }
    
    if (minuteCount > 5) {
      return res.status(401).json({
        success: false,
        message: "You have reached the maximum number of emails per minute.",
      });
    }
    if (cachedKey) {
      const cachedData = JSON.parse(cachedKey);
      if (!cachedData.isActive) {
        return res
          .status(401)
          .json({ success: false, message: "API key is not active" });
      }
      console.log("API key found in Redis cache, proceeding to email controller");
      req.user = { userId: cachedData.userId }; 
      console.log("User ID from cached API key:", req.user.userId);
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
    req.user = { userId: apiKeyRecord.userId };
    next();
  } catch (error) {
    console.error("Error in emailMiddleware:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
