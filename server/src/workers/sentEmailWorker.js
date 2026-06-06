import { Worker } from "bullmq";
import redisConfig from "../config/redisConfig.js";
import connectDb from "../db/connectDb.js";
import dotenv from "dotenv";

import sentEmailModel from "../models/sentEmailModel.js";
import { finalizeLastAttempt } from "../utils/workerHistory.js";
dotenv.config();

(async () => {
  await connectDb();

  const sentEmailWorker = new Worker(
    "sentEmailQueue",
    async (job) => {
      switch (job.name) {
        case "sentEmail": {
          const workerHistory = finalizeLastAttempt(job.data.workerHistory || [], {
            status: "success",
          });
          await batchSentEmails([
            {
              from: job.data.from,
              to: job.data.to,
              campaign: job.data.campaign,
              html: job.data.html,
              subject: job.data.subject,
              body: job.data.body,
              userId: job.data.userId,
              messageId: job.data.messageId,
              sentAt: job.data.sentAt || new Date(),
              status: "sent",
              workerHistory,
            },
          ]);
          break;
        }
        default:
          console.log("Unknown job type:", job.name);
      }
    },
    {
      connection: redisConfig,
    },
  );
})();


const length = 10;
const batchSentEmails = async (data) => {
  console.log("Batching emails for sent database processing. Batch size:", data);

  const chevckData = await redisConfig.llen("sentEmails");

  console.log("Current length of sentEmails list in Redis:", chevckData);

  const pushtoREDIS = await redisConfig.rpush(
    "sentEmails",
    JSON.stringify(data),
  );
};


const flushBatch = async () => {
    try
    {
  const holdlist = await redisConfig
    .multi()
    .rename("sentEmails", "sentEmailsProcessing")
    .exec();

  const movedData = await redisConfig.lrange("sentEmailsProcessing", 0, -1);
  console.log(
    "Fetched data from sentEmailsProcessing list in Redis:",
    movedData,
  );
  if (movedData.length > 0) {
    console.log(
      "Flushing batch of emails to sent database. Batch size:",
      movedData.length,
    );
    const emails = movedData.map((e) => JSON.parse(e));
    //send eveything to db at oince
    await sentEmailModel.insertMany(emails.flat());
    //clear the processing list
    await redisConfig.del("sentEmailsProcessing");
     console.log("Batch flushed to sent emails database and processing list cleared.");
  } else {
    console.log("No emails to flush to sent emails database.");
  }
}
catch(err){
    console.error("Error flushing batch of sent emails:", err.message);
}
};

setInterval(() => {
  console.log("Running scheduled flush of sent emails...");
  flushBatch();
}, 5000); // 5000 ms = 5 seconds
