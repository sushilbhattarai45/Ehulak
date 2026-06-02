import {Worker} from "bullmq";
import crypto from "crypto";
import { apiKeyQueue } from "../config/queueConfig.js";
import redisConfig from "../config/redisConfig.js";
import apikeyModel from "../models/apiKeyModel.js";
import connectDb from "../db/connectDb.js";
import dotenv from "dotenv";

dotenv.config();

(async()=>{
    try {
    await connectDb();
    }
    catch(err){
        console.error("Error connecting to the database:", err);
    }
})();
const worker = new Worker(
  "apiKeyQueue",
  async (job) => {
    console.log("Processing API key job with ID:", job.id);
    console.log(job.data)
    switch (job.name) {
      case "createApiKey":
        createAPIKey(job.data);
        break;
      default:
        console.log("Unknown job type:", job.name);
    }
  },
  {
    connection: redisConfig,
    concurrency: 5,
  },
);

 const createAPIKey = async (data) => {
  try {
    // const { name } = req.body;

    console.log("Received API key creation job for user ID:", data)
    const userId = data.userId; 
    const keyHash = data.keyHash;
    const apiKeyValue = data.apiKeyValue;
    console.log("Creating API key for user ID:", userId);
    console.log("Key hash to be saved:", keyHash);

  const newApiKey = await apikeyModel.create({
      userId: userId,
      keyHash: keyHash,
      apiKeyValue: apiKeyValue,
    });
    

    console.log("API key created successfully:", newApiKey);
  } catch (error) {
    console.error("Error creating API key:", error);
  }
};

