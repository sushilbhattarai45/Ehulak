// Intercepts send-email requests: validates API key and attaches userId to req.
import crypto from "crypto";
import ApiKeyModel from "../models/apiKeyModel.js";
import redisConfig from "../config/redisConfig.js";

export const emailMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return res
        .status(401)
        .json({ success: false, message: "API key missing" });
    }

    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const cachedKey = await redisConfig.get(`apiKey:${keyHash}`);
    if (cachedKey) {
      const cachedData = JSON.parse(cachedKey);
      if (!cachedData.isActive) {
        return res
          .status(401)
          .json({ success: false, message: "API key is not active" });
      }
      req.user = { userId: cachedData.userId };
      return next();
    }

    const apiKeyRecord = await ApiKeyModel.findOne({ keyHash });

    if (!apiKeyRecord || !apiKeyRecord.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid API key" });
    }

    if (!apiKeyRecord.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "API key is not active" });
    }

    req.user = { userId: apiKeyRecord.userId };
    next();
  } catch (error) {
    console.error("Error in emailMiddleware:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
