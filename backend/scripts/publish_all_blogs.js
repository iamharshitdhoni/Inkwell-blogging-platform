import mongoose from "mongoose";
import dotenv from "dotenv";
import Blog from "../models/blogs.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const filter = { status: { $ne: 'published' } };
    const update = { $set: { status: 'published', isApproved: true } };

    const result = await Blog.updateMany(filter, update);
    console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount} blogs.`);

    process.exit(0);
  } catch (err) {
    console.error('Error publishing blogs:', err);
    process.exit(1);
  }
};

run();
