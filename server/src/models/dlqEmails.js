import mongoose from 'mongoose';

const workerHistoryEntrySchema = new mongoose.Schema(
  {
    worker: { type: String, required: true },
    timestamp: { type: Date, required: true },
    attempt: { type: Number },
    status: {
      type: String,
      enum: ["picked_up", "success", "failed"],
      default: "picked_up",
    },
    errorMessage: { type: String },
  },
  { _id: false },
);

const dlqEmailSchema = new mongoose.Schema({
  from: { type: String, required: false },
  to: { type: String, required: false },
  subject: { type: String, required: false },
  userId: { type: String, required: false },
  body: { type: String, required: false },
  messageId: { type: String },
  campaign: { type: String, required: false },
  html: { type: String, required: false },
  status: { type: String, required: false, default: "failed" },
  errorMessage: { type: String, required: false },
  workerHistory: { type: [workerHistoryEntrySchema], default: [] },
  timestamp: { type: Date, default: Date.now },
});

const dlqEmailModel = mongoose.model("DlqEmail", dlqEmailSchema);

export default dlqEmailModel;