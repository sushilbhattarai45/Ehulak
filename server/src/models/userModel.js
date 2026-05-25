import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  //google sign in
  userId: { type: String, unique: true, required: false },
  email: { type: String, unique: true, required: true },
  name: { type: String, required: false },
  image: { type: String },
  status: { type: String, enum: ["active", "inactive"], default: "inactive" },
  accountType: { type: String, enum: ["google", "local"], default: "local" },
  firstTimeLogin: {
    type: Boolean,
    default: true,
  },
  organization: { type: String },
  password: {
    type: String,
    required: function () {
      return this.accountType === "local";
    },
  },
});

const User = mongoose.model("User", userSchema);

export default User;
