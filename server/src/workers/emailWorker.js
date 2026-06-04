import { Worker } from "bullmq";
import { emailDLQ, sentEmailQueue } from "../config/queueConfig.js";
import redisConfig from "../config/redisConfig.js";
import nodemailer from "nodemailer";
import {
  appendWorkerPickup,
  finalizeLastAttempt,
} from "../utils/workerHistory.js";
import userModel from "../models/userModel.js";
import smtpModel from "../models/smtpModel.js";
import { encrypt, decrypt } from "../utils/encryptDecrypt.js";
import dotenv from "dotenv";
dotenv.config();
import sgMail from '@sendgrid/mail';
import { getTransporter } from "../utils/transporterCache.js";
import connectDb from "../db/connectDb.js";

(
  async () => {
 try{
  await connectDb();
  console.log("Connected to the database");
 }catch(error){
  console.error("Error connecting to the database:", error);
 }
  }
)();

// (async () => {

//   console.log("SMTP_HOST:", process.env.SMTP_HOST);
//   console.log("SMTP_PORT:", process.env.SMTP_PORT);
//   console.log("SMTP_USER:", process.env.SMTP_USER);
//   console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD);
//   try {
//     await transporter.verify();
//     console.log(" Email transporter is ready");
//   } catch (err) {
//     console.error(" Transporter verification failed:", err);
//   }
// })();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


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

  console.log("Payload:", JSON.stringify(payload));
  return {
    to: payload.to,
    from: 'noreply@ehulak.tech',
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
  console.log("Sending email to:", JSON.stringify(fields));

  const mailOptions = {
    from: fields.from,
    to: fields.to,
    subject: fields.subject,
    text: fields.text,
    html: fields.html,
    campaign: fields.campaign,
  };
try{

  let customSMTP = false;
  let smtpDetails={};
// check if user is using custom SMTP

console.log('user id:', fields.userId);
const user = await userModel.findOne({ userId: fields.userId });

if(!user){
  console.error("User not found");
  throw new Error("User not found");
}

if (user.useCustomSMTP) {
  const smtp = await smtpModel.findOne({ userId: fields.userId });
  if (!smtp) {
    throw new Error("Custom SMTP enabled but config not found");
  }
  customSMTP = true;

  console.log('smtp port:', smtp.port);
  smtpDetails = {
    userId: fields.userId,
    host: decrypt(smtp.hostname),
    from: smtp.from,
    port: smtp.port,
    username: decrypt(smtp.username),
    password: decrypt(smtp.password),
  };

  const transporter = getTransporter(smtpDetails);
mailOptions.from = smtpDetails.from;
  await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    return true;

}
else
{
  await sgMail.send(mailOptions);
  console.log("Email sent successfully to:", JSON.stringify(mailOptions));
}
  sentEmailQueue.add(
    "sentEmail",
    {
      customSMTP: customSMTP,
      from: customSMTP ? smtpDetails.from : fields.from,
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