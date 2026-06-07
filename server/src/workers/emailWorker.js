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

const transportCache = new Map();
 const getTransporter = async (smtpDetails) => {
  const cacheKey = smtpDetails.smtpId;


  const disabledSMTP = await redisConfig.exists(`disabledSMTPs:${cacheKey}`);

  if (disabledSMTP) {
    console.log("SMTP is disabled");
    throw new Error("SMTP is disabled");
  }

  if (transportCache.has(cacheKey)) {
    transportCache.get(cacheKey).lastUsed = new Date();
    return transportCache.get(cacheKey).transporter;
  }


  console.log("creating new transporter");

  const transporter = nodemailer.createTransport({
    host: smtpDetails.host,
    port: smtpDetails.port,
    secure: smtpDetails.port === 465,
    auth: {
      user: smtpDetails.username,
      pass: smtpDetails.password,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  transportCache.set(cacheKey, {
    transporter,
    lastUsed: new Date(),
  });

  //list all keys in transportCache

  console.log(`Created SMTP transporter for ${cacheKey}`);

  return transporter;
};

 const clearTransportCache = () => {

for (const key of transportCache.keys()) {
const transporter = transportCache.get(key);
console.log('transporter:', transporter.lastUsed);
if(Date.now() - transporter.lastUsed > 1000*60*5)//5 minutes
  {
    transporter.transporter.close();
    transportCache.delete(key);
    console.log(`Deleted expired SMTP transporter for ${key}`);
  }
  }

};


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

const appendPlatformDisclaimer = ({ text, html, userEmail }) => {
  const textFooter = `\n\n---\nDisclaimer: This email was sent through the Ehulak platform. Ehulak is not responsible for the content of this message. This email is associated with the account ${userEmail}.`;
  const htmlFooter = `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px;" /><p style="font-size:11px;color:#6b7280;line-height:1.5;margin:0;"><strong>Disclaimer:</strong> This email was sent through the Ehulak platform. Ehulak is not responsible for the content of this message. This email is associated with the account <a href="mailto:${userEmail}" style="color:#6b7280;">${userEmail}</a>.</p>`;

  const baseText = text || "";
  const baseHtml = html || (baseText ? `<p>${baseText.replace(/\n/g, "<br>")}</p>` : "");

  return {
    text: baseText + textFooter,
    html: baseHtml + htmlFooter,
  };
};

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
    type: payload?.type,
    messageId: payload.messageId,
  };
};

const sendEmail = async (jobData, workerHistory) => {
  console.log("-----------------------------------------------");
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

if(fields.type === "internal"){
  await sgMail.send(mailOptions);
  console.log("Email sent successfully to:", JSON.stringify(mailOptions));
  return true;
}
const user = await userModel.findOne({ userId: fields.userId });
console.log('user:', JSON.stringify(user));

if(!user){
  console.error("User not found");
  throw new Error("User not found");
}

if (user.useCustomSMTP) {
  const smtp = await smtpModel.findOne({ userId: fields.userId });
  console.log('smtp:', JSON.stringify(smtp));
  if (!smtp) {
    console.error("Custom SMTP enabled but config not found");

    throw new Error("Custom SMTP enabled but config not found");
  }
  customSMTP = true;

  console.log('smtp port:', smtp.port);
  smtpDetails = {
    userId: fields.userId,
    host: decrypt(smtp.hostname),
    from: smtp.from,
    smtpId: smtp.smtpId,
    port: smtp.port,
    username: decrypt(smtp.username),
    password: decrypt(smtp.password),
  };
  console.log('smtpDetails:', JSON.stringify(smtpDetails));

  const transporter = await getTransporter(smtpDetails);
mailOptions.from = smtpDetails.from;
  await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    return true;

}

else{

  const withDisclaimer = appendPlatformDisclaimer({
    text: mailOptions.text,
    html: mailOptions.html,
    userEmail: user.email,
  });
  mailOptions.text = withDisclaimer.text;
  mailOptions.html = withDisclaimer.html;
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
      body: customSMTP ? fields.body : mailOptions.text,
      html: customSMTP ? fields.html : mailOptions.html,
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

setInterval(() => {
  clearTransportCache();
  console.log('transportCache cleared');
}, 1000*60); // 1 minute