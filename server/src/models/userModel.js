import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  //google sign in
  userId: { type: String, unique: true, required: false },
  email: { type: String, unique: true, required: true },
  name: { type: String, required: false },
  image: { type: String },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  accountType: { type: String, enum: ["google", "local"], default: "local" },
  password: {
    type: String,
    required: function () {
      return this.accountType === "local";
    },
  },
});

const User = mongoose.model("User", userSchema);

export default User;
