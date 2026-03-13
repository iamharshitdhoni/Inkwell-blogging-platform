import express from "express";
import {
  addComment,
  getCommentsByBlog,
  deleteComment,
  editComment
} from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Add comment (Protected)
router.post("/", protect, addComment);

// Get comments of a blog (Public)
router.get("/blog/:blogId", getCommentsByBlog);

// Edit comment (Protected - own comments only)
router.put("/:id", protect, editComment);

// Delete comment (Protected)
router.delete("/:id", protect, deleteComment);

export default router;