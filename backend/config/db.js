import mongoose from "mongoose";

const connectDB = async (mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI) => {
  if (!mongoUri) {
    throw new Error("MongoDB URI is not defined. Set MONGO_URI or MONGODB_URI.");
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;