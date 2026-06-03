import redisConfig from "../config/redisConfig.js";
import smtpModel from "../models/smtpModel.js";

export const createSMTP = async (req, res) => {


  const { hostname, port, username, password, name } = req.body;
  const userId = req.user.userId;
try {
//checking if smtp already exists
const existingSmtp = await smtpModel.findOne({ userId });
if (existingSmtp) {
  return res.status(400).json({ success: false, message: "SMTP already exists" });
}

//encrypting smtp, port, username, password
const encryptedSmtp = encrypt(hostname);
const encryptedPort = encrypt(port);
const encryptedUsername = encrypt(username);
const encryptedPassword = encrypt(password);
const smtpId = crypto.randomBytes(16).toString("hex");
await smtpModel.create({ userId, smtpId, hostname, port, username, password, name });
await redisConfig.set(`smtp:${userId}`, JSON.stringify({ hostname, port, username, password, name, smtpId, isActive: true, updatedAt: Date.now(), createdAt: Date.now()}, "EX", 3600));
  res.json({ success: true, message: "SMTP created successfully" });
} catch (error) {
  console.error("Error creating SMTP:", error);
  return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getSMTP = async (req, res) => {
  const userId = req.user.userId;
  const smtpId = req.body.smtpId;
  try {
    const cachedSmtp = await redisConfig.get(`smtp:${smtpId}`);
    if (cachedSmtp) {
      return res.json({ success: true, smtp: JSON.parse(cachedSmtp) });
    }
    const smtp = await smtpModel.find({ smtpId });
    if (!smtp) {
      return res.status(404).json({ success: false, message: "SMTP not found" });
    }
    await redisConfig.set(`smtp:${smtpId}`, JSON.stringify(smtp));
    res.json({ success: true, smtp });
  } catch (error) {
    console.error("Error getting SMTP:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateSMTP = async (req, res) => {
  const smtpId = req.body.smtpId;
  const { hostname, port, username, password, name } = req.body;
  try {
    const existingSmtp = await smtpModel.findOne({ smtpId });
    if (!existingSmtp) {
      return res.status(404).json({ success: false, message: "SMTP not found" });
    }
    await smtpModel.updateOne({ smtpId }, { hostname, port, username, password, name });
    await redisConfig.set(`smtp:${smtpId}`, JSON.stringify({ hostname, port, username, password, name, smtpId, isActive: true, updatedAt: Date.now(), createdAt: Date.now()}, "EX", 3600));
    res.json({ success: true, message: "SMTP updated successfully" });
  } catch (error) {
    console.error("Error updating SMTP:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteSMTP = async (req, res) => { 
  const smtpId = req.body.smtpId;
  try {
    await smtpModel.deleteOne({ smtpId });
    await redisConfig.del(`smtp:${smtpId}`);    
    res.json({ success: true, message: "SMTP deleted successfully" });
  } catch (error) {
    console.error("Error deleting SMTP:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};