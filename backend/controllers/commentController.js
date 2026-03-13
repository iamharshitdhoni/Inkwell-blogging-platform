import Comment from "../models/comments.js";
import Blog from "../models/blogs.js";

// Add comment (Any authenticated user)
export const addComment = async (req, res) => {
  try {
    const { text, blogId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (!blogId) {
      return res.status(400).json({ message: "Blog ID is required" });
    }

    if (text.trim().length < 2) {
      return res.status(400).json({ message: "Comment must be at least 2 characters" });
    }

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const comment = await Comment.create({
      text: text.trim(),
      blog: blogId,
      user: req.user._id
    });

    const populatedComment = await comment.populate("user", "name email _id avatar username");

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get comments of a blog
export const getCommentsByBlog = async (req, res) => {
  try {
    const comments = await Comment.find({ blog: req.params.blogId })
      .populate("user", "name email _id avatar username")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete comment (User can delete own comment, Admin can delete any)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Check ownership or admin role
    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit comment (User can edit own comment only)
export const editComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (text.trim().length < 2) {
      return res.status(400).json({ message: "Comment must be at least 2 characters" });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Check ownership
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.text = text.trim();
    await comment.save();

    const updatedComment = await comment.populate("user", "name email _id avatar username");
    res.json({ message: "Comment updated successfully", comment: updatedComment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};