import express from "express";
import {
  signupUser,
  loginUser,
  signupAuthor,
  loginAuthor,
  signupAdmin,
  loginAdmin
} from "../controllers/authController.js";
import {
  sendSignupOTP,
  verifySignupOTP,
  sendLoginOTP,
  verifyLoginOTP,
} from "../controllers/otpAuthController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ============================================================================
// USER AUTHENTICATION ROUTES (Password-based)
// ============================================================================
router.post("/user/signup", signupUser);
router.post("/user/login", loginUser);

// ============================================================================
// AUTHOR AUTHENTICATION ROUTES (Password-based)
// ============================================================================
router.post("/author/signup", signupAuthor);
router.post("/author/login", loginAuthor);

// ============================================================================
// ADMIN AUTHENTICATION ROUTES (Protected, Password-based)
// ============================================================================
router.post("/admin/signup", protect, signupAdmin);
router.post("/admin/login", loginAdmin);

// ============================================================================
// OTP-BASED AUTHENTICATION ROUTES (Passwordless)
// ============================================================================
// SIGNUP FLOW: Send OTP → Verify OTP → Create Account
router.post("/otp/send-signup-otp", sendSignupOTP);
router.post("/otp/verify-signup-otp", verifySignupOTP);

// LOGIN FLOW: Send OTP → Verify OTP → Login
router.post("/otp/send-login-otp", sendLoginOTP);
router.post("/otp/verify-login-otp", verifyLoginOTP);

export default router;
