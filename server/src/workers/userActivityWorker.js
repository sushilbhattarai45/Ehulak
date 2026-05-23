import { Worker } from "bullmq";
import redisConfig from "../config/redisConfig.js";
import connectDb from "../db/connectDb.js";
import User from "../models/userModel.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  await connectDb();
})();

new Worker(
  "userActivityQueue",
  async (job) => {
    console.log("Processing user activity job with ID:", job.id);
    console.log("Job data:", job.data);

    switch (job.name) {
      case "createUser":
        await createUser(job.data);
        break;

      default:
        console.log("Unknown job type:", job.name);
    }
  },
  {
    connection: redisConfig,
    concurrency: 10,
  },
);

const createUser = async (data) => {
  try {
    const user = new User({
      userId: data.activityData.data.userId,
      email: data.activityData.data.email,
      name: data.activityData.data.name,
      image: data.activityData.data.image,
      accountType: data.activityData.data.accountType,
      status: data.activityData.data.status,
      password: data.activityData.data.password,
    });

    let savedUser = await user.save();
    console.log("User created successfully:", savedUser);
  } catch (err) {
    console.error("Error logging user activity:", err);
  }
};
