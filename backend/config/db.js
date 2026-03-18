import mongoose from "mongoose";

const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/blogDB";
const connectDB = async (mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_LOCAL_URI) => {
  if (!mongoUri) {
    throw new Error("MongoDB URI is not defined. Set MONGO_URI or MONGODB_URI.");
  }

  if (mongoUri === DEFAULT_LOCAL_URI) {
    console.warn("\n⚠️  mongoUri not defined in env. Falling back to local MongoDB URL (development only):", DEFAULT_LOCAL_URI);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      // mongoose v6+ uses new URL parser and unified topology by default.
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;