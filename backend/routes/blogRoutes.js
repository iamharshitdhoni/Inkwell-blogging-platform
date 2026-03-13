import express from "express";
import {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  getAuthorBlogs,
  getPublishedBlogsByAuthor,
  toggleLikeBlog,
  approveBlog,
  rejectBlog,
  getAllBlogsAdmin
} from "../controllers/blogController.js";
import { protect } from "../middleware/auth.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ============================================================================
// ⚠️  IMPORTANT: More specific routes MUST come before generic :id routes
// ============================================================================

// ============================================================================
// AUTHOR DASHBOARD ROUTES (Protected)
// ============================================================================

// Get author's own blogs with stats
router.get("/author/all", protect, getAuthorBlogs);

// ============================================================================
// ADMIN DASHBOARD ROUTES (Admin Only)
// ============================================================================

// Get all blogs including pending approval
router.get("/admin/all", protect, authorizeRole(['admin']), getAllBlogsAdmin);

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Get published blogs for a specific author (public)
router.get("/author/:id", getPublishedBlogsByAuthor);

// Get all published & approved blogs
router.get("/", getAllBlogs);

// ============================================================================
// PROTECTED ROUTES (Require authentication)
// ============================================================================

// Create blog (Author/Admin only)
// ✅ Authentication: Required
// ✅ Authorization: Author or Admin role
router.post(
  "/",
  protect,
  authorizeRole(['writer', 'admin']),
  createBlog
);

// ============================================================================
// BLOG-SPECIFIC ROUTES (Must come after /author/all and /admin/all)
// ============================================================================

// Get single blog details (Public - anyone can view)
// ✅ No authentication required
router.get("/:id", getSingleBlog);

// Update own blog (Author/Admin)
// ✅ Authentication: Required
// ✅ Authorization: Must be author or admin
// ✅ Ownership: Controller checks if author owns the blog
router.put(
  "/:id",
  protect,
  authorizeRole(['writer', 'admin']),
  updateBlog
);

// Delete own blog (Author/Admin)
// ✅ Authentication: Required
// ✅ Authorization: Must be author or admin
// ✅ Ownership: Controller checks if author owns the blog
router.delete(
  "/:id",
  protect,
  authorizeRole(['writer', 'admin']),
  deleteBlog
);

// Publish own blog (Author/Admin)
// ✅ Authentication: Required
// ✅ Authorization: Must be author or admin
// ✅ Business Logic: Authors need approval before publishing
router.patch(
  "/:id/publish",
  protect,
  authorizeRole(['writer', 'admin']),
  publishBlog
);

// Like/Unlike blog (Any authenticated user)
// ✅ Authentication: Required
// ✅ Authorization: Any role can like
router.post(
  "/:id/like",
  protect,
  toggleLikeBlog
);

// Approve blog (Admin only)
// ✅ Authentication: Required
// ✅ Authorization: Admin only
router.patch(
  "/:id/approve",
  protect,
  authorizeRole(['writer', 'admin']),
  approveBlog
);

// Reject blog (Admin only)
// ✅ Authentication: Required
// ✅ Authorization: Admin only
router.patch(
  "/:id/reject",
  protect,
  authorizeRole(['writer', 'admin']),
  rejectBlog
);

export default router;