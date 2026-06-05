import crypto from "crypto";
import redisConfig from "../config/redisConfig.js";

export const rateLimitMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return res
        .status(403)
        .json({ success: false, message: "API key missing" });
    }

    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const hourlyKey = `emailCount:${keyHash}`;
    const minuteKey = `emailCountPerMinute:${keyHash}`;

    const hourlyCount = await redisConfig.incr(hourlyKey);
    const minuteCount = await redisConfig.incr(minuteKey);

    if (hourlyCount === 1) {
      await redisConfig.expire(hourlyKey, 3600);
    }

    if (minuteCount === 1) {
      await redisConfig.expire(minuteKey, 60);
    }

    if (hourlyCount > 60) {
      return res.status(403).json({
        success: false,
        message: "You have reached the maximum number of emails per hour.",
      });
    }

    if (minuteCount > 5) {
      return res.status(403).json({
        success: false,
        message: "You have reached the maximum number of emails per minute.",
      });
    }

    next();
  } catch (error) {
    console.error("Error in rateLimitMiddleware:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
