import mongoose from "mongoose";
const apiKeySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: "default",
  },
  keyHash: {
    type: String,
    required: true,
    unique: true,
  },
  apiKeyValue: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  lastUsedAt: {
    type: Date,
    default: null,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
});

const apikeyModel = mongoose.model("ApiKey", apiKeySchema);

export default apikeyModel;