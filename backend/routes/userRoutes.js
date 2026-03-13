import express from "express";
import { 
  registerUser, 
  loginUser, 
  getAllUsers, 
  getUserById, 
  updateUserProfile, 
  searchUsers,
  changeUserRole,
  changeUserRoleEnhanced,
  toggleUserStatus,
  getUserStats,
  signupUser,
  signupAuthor,
  signupAdmin,
  getAdminDashboard,
  verifyEmail,
  resendVerificationEmail
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Legacy auth routes (keep for backward compatibility)
router.post("/register", registerUser);
router.post("/login", loginUser);

// Email verification routes (public)
router.get("/verify-email", verifyEmail);
router.post("/resend-verification-email", resendVerificationEmail);

// Three separate signup modules
router.post("/signup/user", signupUser);        // Public: Normal user signup
router.post("/signup/author", signupAuthor);    // Public: Author signup
router.post("/signup/admin", protect, signupAdmin); // Protected: Admin-only signup

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

router.get("/search/query", searchUsers);
router.get("/:id", getUserById);
router.get("/", getAllUsers);

// ============================================================================
// PROTECTED ROUTES (Require authentication)
// ============================================================================

router.put("/:id", protect, updateUserProfile);
router.get("/:id/stats", protect, getUserStats);

// ============================================================================
// ADMIN ROUTES (Require admin role)
// ============================================================================

router.get("/admin/dashboard/stats", protect, authorizeRole(['admin']), getAdminDashboard);
router.patch("/:id/role", protect, authorizeRole(['admin']), changeUserRoleEnhanced);
router.patch("/:id/toggle-status", protect, authorizeRole(['admin']), toggleUserStatus);

export default router;