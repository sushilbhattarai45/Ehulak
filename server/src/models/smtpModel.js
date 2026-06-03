import mongoose from "mongoose";

const smtpSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: false, default: "default" },
  smtp: { type: String, required: true },
  port: { type: Number, required: true },
  smtpId: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const smtpModel = mongoose.model("smtp", smtpSchema);

export default smtpModel;