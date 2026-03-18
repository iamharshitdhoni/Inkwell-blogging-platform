import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("\n❌ Missing MongoDB URI. Set MONGO_URI or MONGODB_URI in environment variables.");
  process.exit(1);
}

app.use(cors());
// Increase payload limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/health", healthRoutes);

const startServer = async () => {
  try {
    await connectDB(MONGO_URI);
    app.listen(PORT, HOST, () => console.log(`Server running on port ${PORT}`));
    console.log(`MongoDB connected, listening on ${HOST}:${PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();