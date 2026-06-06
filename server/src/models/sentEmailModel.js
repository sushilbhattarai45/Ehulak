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

const sentEmailSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  userId: { type: String, required: true },
  body: { type: String, required: false },
  messageId: { type: String },
  campaign: { type: String, required: true },
  html: { type: String, required: false },
  status: { type: String, enum: ["sent", "failed"], default: "sent" },
  errorMessage: { type: String },
  workerHistory: { type: [workerHistoryEntrySchema], default: [] },
  timestamp: { type: Date, default: Date.now },
});

sentEmailSchema.index({ userId: 1, timestamp: -1 });
sentEmailSchema.index({ userId: 1, to: 1 });
sentEmailSchema.index({ errorMessage: 1 });



const sentEmailModel = mongoose.model('SentEmail', sentEmailSchema);

export default sentEmailModel;