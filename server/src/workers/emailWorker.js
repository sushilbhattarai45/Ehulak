import { Worker } from "bullmq";
import { emailDLQ, sentEmailQueue } from "../config/queueConfig.js";
import redisConfig from "../config/redisConfig.js";
import nodemailer from "nodemailer";
import {
  appendWorkerPickup,
  finalizeLastAttempt,
} from "../utils/workerHistory.js";


import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  pool: true,
  maxConnections: 4,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 4,
  tls: {
    rejectUnauthorized: false,
  },
});

(async () => {

  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD);
  try {
    await transporter.verify();
    console.log(" Email transporter is ready");
  } catch (err) {
    console.error(" Transporter verification failed:", err);
  }
})();


let counter = 0;
const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("-----------------------------");
    console.log(
      `Processing job #${counter} with ID: ${job.data.emailData?.to || job.data.emailData?.emailData?.to}`,
    );

    const attempt = job.attemptsMade + 1;
    let workerHistory = appendWorkerPickup(job.data.workerHistory || [], {
      worker: "emailWorker",
      timestamp: new Date(),
      attempt,
      status: "picked_up",
    });

    await job.updateData({ ...job.data, workerHistory });

    switch (job.name) {
      case "sendEmail":
        try {
          await sendEmail(job.data, workerHistory);
          workerHistory = finalizeLastAttempt(workerHistory, {
            status: "success",
          });
          await job.updateData({ ...job.data, workerHistory });
        } catch (error) {
          workerHistory = finalizeLastAttempt(workerHistory, {
            status: "failed",
            errorMessage: error.message,
          });
          await job.updateData({ ...job.data, workerHistory });
          throw error;
        }
        break;
      default:
        console.log("Unknown job type:", job.name);
    }
  },
  {
    connection: redisConfig,
    concurrency: 2,
  },
);

const getEmailFields = (emailData) => {
  const payload = emailData.emailData || emailData;
  return {
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text || payload.body,
    body: payload.body || payload.text,
    html: payload.html,
    userId: payload.userId,
    campaign: payload.campaign,
    messageId: payload.messageId,
  };
};

const sendEmail = async (jobData, workerHistory) => {
  const fields = getEmailFields(jobData.emailData);
  console.log("Sending email to:", fields.to);

  const mailOptions = {
    from: fields.from,
    to: fields.to,
    subject: fields.subject,
    text: fields.text,
    html: fields.html,
    campaign: fields.campaign,
  };
try{

  console.log("Mail options:", mailOptions);  
  await transporter.sendMail(mailOptions);
  console.log("Email sent successfully to:", JSON.stringify(fields));

  sentEmailQueue.add(
    "sentEmail",
    {
      from: fields.from,
      to: fields.to,
      subject: fields.subject,
      body: fields.body,
      html: fields.html,
      campaign: fields.campaign,
      userId: fields.userId,
      messageId: fields.messageId,
      sentAt: new Date(),
      workerHistory: appendWorkerPickup(workerHistory, {
        worker: "sentEmailWorker",
        timestamp: new Date(),
        status: "picked_up",
      }),
    },
    {
      removeOnComplete: true,
    },
  );
  return true;
}catch(error){
  console.error("Error sending email:", error);
  throw error;
}

};

worker.on("failed", (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    console.log("sending to dlq");

    emailDLQ.add(
      "failedEmail",
      {
        jobData: job.data,
        error: err.message,
        workerHistory: job.data.workerHistory || [],
      },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  } else {
    console.warn("Retrying job", err.message);
  }
});
