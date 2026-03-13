import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    default: "General",
  },
  tags: [
    {
      type: String,
    },
  ],
  description: {
    type: String,
    default: "",
  },
}, { timestamps: true });

export default mongoose.model("Blog", blogSchema);