// utils/crypto.js
import smtpModel from "../models/smtpModel.js";
import redisConfig from "../config/redisConfig.js";
import crypto from "crypto";
import dotenv from "dotenv";
import { deleteTransporter }
from "../utils/transporterCache.js";

dotenv.config();
const ALGORITHM = "aes-256-gcm";

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_SECRET)
  .digest();

export function encrypt(text) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    iv
  );

  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(payload) {
  const [ivHex, authTagHex, encryptedHex] =
    payload.split(":");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(
    Buffer.from(authTagHex, "hex")
  );

  let decrypted = decipher.update(
    encryptedHex,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
}

export const createSMTP = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
   
    const { hostname, port, username, password, name } =
      req.body;
      //demo json
    //   const demoJson = {
    //     hostname: "smtp.gmail.com",
    //     port: 587,
    //     username: "your_username",
    //     password: "your_password",
    //     name: "Your Name",
    //   };

    const userId = req.user.userId;

    if (!hostname || !port || !username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (typeof hostname !== "string" || typeof port !== "number" || typeof username !== "string" || typeof password !== "string" || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "All fields must be strings",
      });
    }
    if (port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: "Port must be between 1 and 65535",
      });
    }

    //cange port to string
   

    const existing = await smtpModel.findOne({ userId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "SMTP already exists",
      });
    }

    const smtpId = crypto.randomUUID()+Date.now();

   let newSmtp = await smtpModel.create({
      userId,
      smtpId,
      hostname: encrypt(hostname),
      port: port,
      username: encrypt(username),
      password: encrypt(password),
      name,
    });

    console.log("SMTP created successfully", newSmtp);
   
    return res.json({
      success: true,
      message: "SMTP created successfully",
      smtp: newSmtp,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
      const {
        smtpId,
        hostname,
        port,
        username,
        password,
        name,
      } = req.body;
  
      const smtp = await smtpModel.findOne({ smtpId });
  
      if (!smtp) {
        return res.status(404).json({
          success: false,
          message: "SMTP not found",
        });
      }
  
      await smtpModel.updateOne(
        { smtpId },
        {
          hostname: encrypt(hostname),
          port: port,
          username: encrypt(username),
          password: encrypt(password),
          name,
        }
      );
  
      return res.json({
        success: true,
        message: "SMTP updated successfully",
      });
    } catch (error) {
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
      
      await smtpModel.deleteOne({ smtpId });
      await redisConfig.del(`smtp:${smtpId}`);
      deleteTransporter(smtp.userId);
      return res.status(200).json({
      success: true,
      message: "SMTP deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
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
          password: "********",
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }