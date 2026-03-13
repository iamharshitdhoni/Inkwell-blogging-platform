import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: String,
  blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);