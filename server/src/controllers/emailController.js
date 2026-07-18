import crypto from "crypto";
import { producer } from "../kafka/producer.js";
import dlqEmailModel from "../models/dlqEmails.js";
import sentEmailModel from "../models/sentEmailModel.js";
import mongoose from "mongoose";
import redisConfig from "../config/redisConfig.js";
let count = 0;
import { z, ZodError } from "zod";

const schema = z.object({
  to: z.string().includes("@"),

  subject: z.string().min(1, { message: "Subject is required" }),

  body: z.string().min(1, { message: "Body is required" }),

  html: z.string().min(1, { message: "HTML content is required" }),

  campaign: z.string().min(1, { message: "Campaign name is required" }),
});
export async function processEmail(req, res) {
  try {
    const validatedData = schema.parse(req.body);
    const { to, subject, body, html, campaign } = validatedData;
    console.log("Received email processing request with body:");
    const data = {
      to: to,
      subject: subject,
      body: body,
      html: html,
      campaign: campaign,
      date: new Date(),
      userId: req.user.userId,
      messageId: crypto.randomUUID(),
    };

    console.log("Received email processing request:", data);
    producer({
      type: "email",
      action: "sendEmail",
      emailData: data,
    });

    if (!req.isCustomSMTP) {
      console.log(
        "Incrementing email count for user:",
        req.user.userId + req.isCustomSMTP,
      );
      await redisConfig.incr(`emailCount:${req.user.userId}`);
    }

    //increment the email count

    res.status(200).json({ message: `Email will be sent to ${to} shortly!` });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: z.flattenError(error).fieldErrors,
      });
    } else {
      return res.status(500).json({
        error: "Internal Server Error from email controller",
        message: error.message,
      });
    }
  }
}
export async function getDLQEmails(req, res) {
  try {
    const userId = req.user.userId;

    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Implement logic to fetch emails from the Dead Letter Queue (DLQ)
    console.log("Fetching DLQ emails for user:", userId);

    // query DLQ collection
    const dlqEmails = await dlqEmailModel
      .find({ userId })
      .sort({ timestamp: -1 }) // latest failures first
      .skip(skip)
      .limit(limit);

    // total count for pagination UI
    const total = await dlqEmailModel.countDocuments({ userId });

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: dlqEmails,
    });
  } catch (error) {
    // console.error("Error fetching DLQ emails:", error);
    console.error("Error fetching DLQ emails:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getSentEmails(req, res) {
  try {
    const userId = req.user.userId;

    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Implement logic to fetch sent emails from the database
    console.log("Fetching sent emails for user:", userId);

    // query sent emails collection
    const sentEmails = await sentEmailModel
      .find({ userId })
      .sort({ timestamp: -1 }) // latest first
      .skip(skip)
      .limit(limit);

    // total count for pagination UI
    const total = await sentEmailModel.countDocuments({ userId });

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: sentEmails,
    });
  } catch (error) {
    console.error("Error fetching sent emails:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getEmailEvents(req, res) {
  try {
    const userId = req.user.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    console.log("Fetching email events for user:", userId);

    const [dlqTotal, sentTotal] = await Promise.all([
      dlqEmailModel.countDocuments({ userId }),
      sentEmailModel.countDocuments({ userId }),
    ]);

    const total = dlqTotal + sentTotal;
    const sentColl = sentEmailModel.collection.name;

    const events = await dlqEmailModel.aggregate([
      { $match: { userId } },
      {
        $addFields: {
          source: "dlq",
          status: "failed",
        },
      },
      {
        $unionWith: {
          coll: sentColl,
          pipeline: [
            { $match: { userId } },
            {
              $addFields: {
                source: "sent",
                status: {
                  $cond: {
                    if: { $eq: ["$status", "sent"] },
                    then: "success",
                    else: "failed",
                  },
                },
              },
            },
          ],
        },
      },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      dlqTotal,
      sentTotal,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching email events:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getEmailEventById(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const [dlqEvent, sentEvent] = await Promise.all([
      dlqEmailModel.findOne({ _id: objectId, userId }).lean(),
      sentEmailModel.findOne({ _id: objectId, userId }).lean(),
    ]);

    const event = dlqEvent || sentEvent;
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const source = dlqEvent ? "dlq" : "sent";
    const status =
      source === "dlq"
        ? "failed"
        : event.status === "sent"
          ? "success"
          : "failed";

    return res.status(200).json({
      data: {
        ...event,
        id: event._id,
        source,
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching email event by id:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
