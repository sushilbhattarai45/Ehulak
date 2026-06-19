// Intercepts send-email requests: validates API key and attaches userId to req.
import crypto from "crypto";
import ApiKeyModel from "../models/apiKeyModel.js";
import redisConfig from "../config/redisConfig.js";

export const emailMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return res
        .status(403)
        .json({ success: false, message: "API key missing" });
    }

    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const cachedKey = await redisConfig.get(`apiKey:${keyHash}`);
    if (cachedKey) {
      const cachedData = JSON.parse(cachedKey);

      if (!cachedData.isActive) {
        return res
          .status(403)
          .json({ success: false, message: "API key is not active" });
      }
      //  const isEmailSentPerAccount = await checkEmailSentPerAccount(cachedData.userId);
      //  if (isEmailSentPerAccount) {
      //   return res
      //     .status(403)
      //     .json({ success: false, message: "You have reached the maximum number of emails per account" });
      //  }

      req.user = { userId: cachedData.userId };
      const isCustomSMTP = await redisConfig.get(
        `isCustomSMTP:${cachedData.userId}`,
      );
      console.log("isCustomSMTP:", isCustomSMTP);

      const parseBoolean = (value) => value === "true";

      req.isCustomSMTP = parseBoolean(isCustomSMTP);

      if (!req.isCustomSMTP) {
        const emailCount = await redisConfig.get(
          `emailCount:${cachedData.userId}`,
        );
        if (emailCount >= 5) {
          return res.status(403).json({
            success: false,
            message:
              "You have reached the maximum number of emails per account using custom SMTP.",
          });
        }
      }
      return next();
    }

    const apiKeyRecord = await ApiKeyModel.findOne({ keyHash });

    if (!apiKeyRecord || !apiKeyRecord.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid API key" });
    }

    if (!apiKeyRecord.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "API key is not active" });
    }

    req.user = { userId: apiKeyRecord.userId };

    const isCustomSMTP = await redisConfig.get(
      `isCustomSMTP:${apiKeyRecord.userId}`,
    );
    const parseBoolean = (value) => value === "true";

    req.isCustomSMTP = parseBoolean(isCustomSMTP);

    if (!req.isCustomSMTP) {
      const emailCount = await redisConfig.get(
        `emailCount:${apiKeyRecord.userId}`,
      );
      if (emailCount >= 5) {
        return res.status(403).json({
          success: false,
          message:
            "You have reached the maximum number of emails per account using default SMTP.",
        });
      }
    }

    //  const isEmailSentPerAccount = await checkEmailSentPerAccount(apiKeyRecord.userId);
    //  if (isEmailSentPerAccount) {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "You have reached the maximum number of emails per account" });
    //  }
    next();
  } catch (error) {
    console.error("Error in emailMiddleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error from email middleware",
    });
  }
};

const checkEmailSentPerAccount = async (userId) => {
  try {
    const emailSentPerAccount = await redisConfig.get(
      `emailSentPerAccount:${userId}`,
    );
    console.log("_________________");
    console.log("Email sent per account:", emailSentPerAccount);
    await redisConfig.incr(`emailSentPerAccount:${userId}`);

    if (emailSentPerAccount > 2) {
      console.log("Email sent per account is greater than 2");
      return true;
    }
    console.log("Email sent per account is less than 2");
    return false;
  } catch (error) {
    console.error("Error in  Check Email Sent Per Account:", error);
    return true;
  }
};
