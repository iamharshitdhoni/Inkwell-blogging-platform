import mongoose from "mongoose";

const connectDB = async (mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI) => {
  if (!mongoUri) {
    throw new Error("MongoDB URI is not defined. Set MONGO_URI or MONGODB_URI.");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      // mongoose v6+ uses new URL parser and unified topology by default,
      // so explicit options are unnecessary and may throw with the latest MongoDB driver.
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;