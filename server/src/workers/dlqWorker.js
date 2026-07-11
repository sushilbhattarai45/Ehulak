import { Worker } from "bullmq";
import redisConfig from "../config/redisConfig.js";
import dlqEmailModel from "../models/dlqEmails.js";
import connectDb from "../db/connectDb.js";
import dotenv from "dotenv";
import {
  appendWorkerPickup,
  finalizeLastAttempt,
} from "../utils/workerHistory.js";

dotenv.config();

(async () => {
  await connectDb();

  const dlqWorker = new Worker(
    "emailDLQ",
    async (job) => {
      console.log("Processing DLQ job with ID:", job.name);
      console.log(
        "Job data userId:",
        job.data.jobData?.emailData?.userId ||
          job.data.jobData?.emailData?.emailData?.userId,
      );

      switch (job.name) {
        case "failedEmail": {
          const emailPayload =
            job.data.jobData?.emailData?.emailData ||
            job.data.jobData?.emailData ||
            job.data.jobData;
          let workerHistory = appendWorkerPickup(job.data.workerHistory || [], {
            worker: "dlqWorker",
            timestamp: new Date(),
            status: "picked_up",
          });
          workerHistory = finalizeLastAttempt(workerHistory, {
            status: "failed",
            errorMessage: job.data.error,
          });

          await batchEmails([
            {
              from: emailPayload.from,
              to: emailPayload.to,
              subject: emailPayload.subject,
              body: emailPayload.body,
              userId: emailPayload.userId,
              messageId: emailPayload.messageId,
              campaign: emailPayload.campaign,
              html: emailPayload.html,
              errorMessage: job.data.error,
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

const sendToDlqDB = async (data) => {
  try {
    console.log("hiiii");
    console.log(data.jobData.emailData.to);
    let dataObject = {
      from: data.jobData.emailData.from,
      to: data.jobData.emailData.to,
      subject: data.jobData.emailData.subject,
      body: data.jobData.emailData.body,
      userId: data.jobData.emailData.userId,
      errorMessage: data.error,
      campaign: data.jobData.emailData.campaign,
      html: data.jobData.emailData.html,
    };
    console.log("Data object to be saved to DLQ database:", dataObject);
    const saveData = await dlqEmailModel.create(dataObject);
    console.log("Returned data after saving to DLQ database:", saveData);
    console.log("Saved to DLQ database with ID:", saveData._id);
  } catch (err) {
    console.error("Error saving to DLQ database:", err.message);
    // throw err;
  }
};



const length = 10;
const batchEmails = async (data) => {
  //check if dlqemail has dat iun it or not

  const chevckData = await redisConfig.llen("dlqEmails");

  console.log("Current length of dlqEmails list in Redis:", chevckData);

  const pushtoREDIS = await redisConfig.rpush(
    "dlqEmails",
    JSON.stringify(data),
  );
};

const flushBatch = async () => {
  const holdlist = await redisConfig
    .multi()
    .rename("dlqEmails", "dlqEmailsProcessing")
    .exec();

  const movedData = await redisConfig.lrange("dlqEmailsProcessing", 0, -1);
  console.log(
    "Fetched data from dlqEmailsProcessing list in Redis:",
    movedData,
  );
  if (movedData.length > 0) {
    console.log(
      "Flushing batch of emails to DLQ database. Batch size:",
      movedData.length,
    );
    const emails = movedData.map((e) => JSON.parse(e));
    //send eveything to db at oince
    await dlqEmailModel.insertMany(emails.flat());
    //clear the processing list
    await redisConfig.del("dlqEmailsProcessing");
     console.log("Batch flushed to DLQ database and processing list cleared.");
    
  } else {
    console.log("No emails to flush to DLQ database.");
  }
};

setInterval(() => {
  flushBatch();
}, 10000); // 10000 ms = 10 seconds
