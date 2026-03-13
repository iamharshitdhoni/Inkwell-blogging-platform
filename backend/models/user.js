import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true },
  password: String,
  avatar: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("User", userSchema);