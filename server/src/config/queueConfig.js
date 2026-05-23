import bullmq from "bullmq";
import redisConfig from "./redisConfig.js";

export const emailQueue = new bullmq.Queue("emailQueue", {
  connection: redisConfig,
  concurrency: 10, // Process up to 10 jobs concurrently
});

export const emailDLQ = new bullmq.Queue("emailDLQ", {
  connection: redisConfig,
  concurrency: 10, // Process up to 10 jobs concurrently
});


export const apiKeyQueue = new bullmq.Queue("apiKeyQueue", {
  connection: redisConfig,
  concurrency: 5, // Process up to 5 jobs concurrently
});

export const userActivityQueue = new bullmq.Queue("userActivityQueue", {
  connection: redisConfig,
  concurrency: 10, // Process up to 10 jobs concurrently
});

export const sentEmailQueue = new bullmq.Queue("sentEmailQueue", {
  connection: redisConfig,
  concurrency: 10,
});
