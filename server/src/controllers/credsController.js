import crypto from "crypto";

import ApiKeyModel from "../models/apiKeyModel.js";
import redisConfig from "../config/redisConfig.js";
import jwt from "jsonwebtoken";
import { producer } from "../kafka/producer.js";

export const createAPIKey = async (req, res) => {
  try {
    console.log("I am here");
    const userId = req.user.userId;
    console.log("Creating API key for user ID:", userId);

    const apiKeyValue = generateUniqueApiKey();
    const keyHash = crypto
      .createHash("sha256")
      .update(apiKeyValue)
      .digest("hex");
    console.log("---------------------------");
    console.log("Generated API key:", apiKeyValue);
    console.log("Hashed API key to be saved:", keyHash);

    await redisConfig.set(
      `apiKey:${keyHash}`,
      JSON.stringify({
        userId,
        isActive: true,
      }),
    );

    // User -> Key mapping
    await redisConfig.set(
      `userApiKey:${userId}`,
      JSON.stringify({
        keyHash,
        apiKey: apiKeyValue,
      }),
    );
    await producer({
      type: "apiKey",
      action: "createApiKey",
      data: {
        userId: req.user.userId,
        keyHash: keyHash,
        apiKey: apiKeyValue,
      },
    });

    res.json({ success: true, apiKey: apiKeyValue, data: apiKeyValue });
  } catch (error) {
    console.error("Error creating API key:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const generateUniqueApiKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const getAPiKeyForUser = async (req, res) => {
  try {
    console.log("Fetching API key for user ID:", req.user.userId);
    const userId = req.user.userId;
    //check in redis first
    const cachedKey = await redisConfig.get(`userApiKey:${userId}`);
console.log("Cached API key data:", cachedKey.apiKey);


    if (cachedKey) {
      console.log("API key found in cache for user ID:", userId);
      return res.json({
        success: true,
        apiKey: JSON.parse(cachedKey).apiKey,
        source: "cache",
      });
    }

    console.log(
      "API key not found in cache, querying database for user ID:",
      userId,
    );
    const apiKeyData = await ApiKeyModel.findOne({ userId });
    if (!apiKeyData) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
        source: "database",
      });
    }
    res.json({ success: true, apiKey: apiKeyData.keyHash, source: "database" });
  } catch (error) {
    console.error("Error fetching API key:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
