// utils/crypto.js
import smtpModel from "../models/smtpModel.js";
import redisConfig from "../config/redisConfig.js";
import crypto from "crypto";
import dotenv from "dotenv";
// import { deleteTransporter }
// from "../utils/transporterCache.js";
import { z, ZodError } from "zod";
import { encrypt, decrypt } from "../utils/encryptDecrypt.js";
import { producer } from "../kafka/producer.js";
import nodemailer from "nodemailer";
import userModel from "../models/userModel.js";

const testSMTP = async (data) => {
  try {
    const transporter = nodemailer.createTransport({
      host: data.hostname,
      port: data.port,
      auth: {
        user: data.username,
        pass: data.password,
      },
    });
    const info = await transporter.sendMail({
      from: data.from,
      to: data.to,
      subject: data.subject,
      text: data.text,
    });
    console.log(info);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const schema = z.object({
  hostname: z.string().min(1, "Hostname is required"),

  port: z
    .number({
      error: "Port must be a number",
    })
    .min(1, "Port must be at least 1")
    .max(65535, "Port must be at most 65535"),

  username: z.string().min(1, "Username is required"),

  password: z.string().min(1, "Password is required"),

  name: z.string().min(1, "SMTP name is required"),

  from: z.string().includes("@"),
});

export const createSMTP = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const validatedData = schema.parse(req.body);
    const { hostname, port, username, password, name, from } = validatedData;
    //demo json
    //   const demoJson = {
    // hostname: "smtp.gmail.com",
    // port: 587,
    // username: "your_username",
    // password: "your_password",
    // name: "Your Name",
    //   };

    const userId = req.user.userId;
    //cange port to string

    const existing = await smtpModel.findOne({ userId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "SMTP already exists",
      });
    }

    const isSMTPWorking = await testSMTP({
      hostname,
      port,
      username,
      password,
      from,
      to: "bhattaraisushil005@gmail.com",
      subject: "Integration Testing for SMTP",
      text: "This is an integration testing for userId: " + userId,
    });

    if (!isSMTPWorking) {
      return res.status(400).json({
        success: false,
        message: "SMTP is not working",
      });
    }

    const smtpId = crypto.randomUUID() + Date.now();

    let newSmtp = await smtpModel.create({
      userId,
      smtpId,
      hostname: encrypt(hostname),
      port: port,
      username: encrypt(username),
      password: encrypt(password),
      name,
      from,
      isWorking: true,
      lastUsedAt: new Date(),
    });

    console.log("SMTP created successfully", newSmtp);

    return res.json({
      success: true,
      message: "SMTP created successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: z.flattenError(error).fieldErrors,
      });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const getUserSMTPs = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const userId = req.user.userId;

    const smtps = await smtpModel.find({ userId });

    if (!smtps) {
      return res.status(404).json({
        success: false,
        message: "No SMTPs found",
      });
    }

    return res.status(200).json({
      success: true,
      smtps: smtps.map((smtp) => ({
        smtpId: smtp.smtpId,
        hostname: decrypt(smtp.hostname),
        port: smtp.port,
        username: decrypt(smtp.username),
        name: smtp.name,
        from: smtp.from,
        password: "********",
      })),
      message: "SMTPs fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSMTP = async (req, res) => {
  try {
    const { smtpId } = req.body;

    const smtp = await smtpModel.findOne({ smtpId });

    if (!smtp) {
      return res.status(404).json({
        success: false,
        message: "SMTP not found",
      });
    }

    return res.json({
      success: true,
      smtp: {
        smtpId: smtp.smtpId,
        hostname: decrypt(smtp.hostname),
        port: smtp.port,
        username: decrypt(smtp.username),
        name: smtp.name,
        from: smtp.from,
        password: "********",
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateSMTP = async (req, res) => {
  try {
    const { smtpId } = req.body;
    const validatedData = schema.parse(req.body);
    const { hostname, port, username, password, name, from } = validatedData;
    if (!smtpId) {
      return res.status(400).json({
        success: false,
        message: "SMTP ID is required",
      });
    }

    const smtp = await smtpModel.findOne({ smtpId });

    if (!smtp) {
      return res.status(404).json({
        success: false,
        message: "SMTP not found",
      });
    }

    const isSMTPWorking = await testSMTP({
      hostname,
      port,
      username,
      password,
      from,
      to: "bhattaraisushil005@gmail.com",
      subject: "Integration Testing for SMTP",
      text: "This is an integration testing for userId: " + smtp.userId,
    });

    if (!isSMTPWorking) {
      return res.status(400).json({
        success: false,
        message:
          "SMTP is not working. Please check the credentials and try again.",
      });
    }

    console.log("SMTP is working");
    console.log({
      hostname: hostname,
      port: port,
      username: username,
      password: password,
      name,
      from,
      isWorking: true,
      lastUsedAt: new Date(),
    });

    await smtpModel.updateOne(
      { smtpId },
      {
        hostname: encrypt(hostname),
        port: port,
        username: encrypt(username),
        password: encrypt(password),
        name,
        from,
        isActive: true,
        isWorking: true,
        lastUsedAt: new Date(),
      },
    );
    await redisConfig.del(`smtp:${smtpId}`);
    await redisConfig.set(`smtp:${smtpId}`, JSON.stringify(smtp));

    return res.json({
      success: true,
      message: "SMTP updated successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: z.flattenError(error).fieldErrors,
      });
    }
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteSMTP = async (req, res) => {
  try {
    const { smtpId } = req.body;

    const smtp = await smtpModel.findOne({ smtpId });

    if (!smtp) {
      return res.status(404).json({
        success: false,
        message: "SMTP not found",
      });
    }

    const updatedSMTP = await smtpModel.updateOne(
      { smtpId },
      { isDisabled: true },
    );

    //set custom SMTP to false
    await userModel.updateOne(
      { userId: smtp.userId },
      { useCustomSMTP: false },
    );

    await smtpModel.deleteOne({ smtpId });
    await redisConfig.del(`smtp:${smtpId}`);
    await redisConfig.del(`isCustomSMTP:${smtp.userId}`);
    await redisConfig.set(
      `disabledSMTPs:${smtpId}`,
      JSON.stringify({
        smtpId: smtpId,
        disabledAt: new Date(),
      }),
    );

    return res.status(200).json({
      success: true,
      message: "SMTP deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const decryptSMTP = async (req, res) => {
  try {
    const { smtpId } = req.body;

    const smtp = await smtpModel.findOne({ smtpId });

    if (!smtp) {
      return res.status(404).json({
        success: false,
        message: "SMTP not found",
      });
    }

    return res.json({
      success: true,
      smtp: {
        smtpId: smtp.smtpId,
        hostname: decrypt(smtp.hostname),
        port: smtp.port,
        username: decrypt(smtp.username),
        name: smtp.name,
        from: smtp.from,
        password: "********",
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
