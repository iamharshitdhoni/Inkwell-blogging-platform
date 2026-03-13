import User from "../models/userModel.js";
import OTP from "../models/otp.js";
import jwt from "jsonwebtoken";
import {
  createOTP,
  verifyOTPCode,
  deleteOTP,
  hasActivePendingOTP,
  getOTPRemainingTime,
} from "../services/otpService.js";
import { sendOTPEmail } from "../services/emailService.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * ============================================================================
 * OTP-BASED AUTHENTICATION CONTROLLER
 * ============================================================================
 * Handles email-based OTP signup and login flows
 * - No passwords required
 * - OTP sent to email
 * - 6-digit code with 5-minute expiry
 */

// ============================================================================
// HELPER: Generate JWT Token
// ============================================================================
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id.toString(),
      userId: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ============================================================================
// ENDPOINT 1: SEND OTP FOR SIGNUP
// ============================================================================
/**
 * POST /api/auth/otp/send-signup-otp
 * 
 * Purpose: Send OTP to email for signup (passwordless registration)
 * 
 * Request:
 * {
 *   "email": "user@gmail.com"
 * }
 * 
 * Responses:
 * - 200: OTP sent successfully
 * - 400: Invalid email or missing fields
 * - 409: Email already registered
 * - 429: Too many OTP requests (wait 5 mins for previous OTP to expire)
 */
export const sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const requestTimestamp = new Date().toISOString();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`🔐 [SIGNUP OTP - SEND] New OTP request`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Timestamp: ${requestTimestamp}`);
    console.log(`═══════════════════════════════════════════════════════════════`);

    // ✅ Validate input
    if (!email || !email.trim()) {
      console.log(`❌ [VALIDATION] Email is required`);
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // ✅ NORMALIZE: Lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`   📧 Email provided: ${email}`);
    console.log(`   📧 Email normalized: ${normalizedEmail}`);

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.log(`❌ [VALIDATION] Invalid email format: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    console.log(`✅ [VALIDATION] Email format valid`);

    // 🔴 CHECK 1: Is email ALREADY registered?
    console.log(`\n   🔍 [CHECK 1] Checking if email already registered...`);
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log(`❌ [EMAIL CHECK] Email already registered: ${normalizedEmail}`);
      console.log(`   User ID: ${existingUser._id}`);
      return res.status(409).json({
        success: false,
        message: "Email is already registered. Please use login instead.",
        code: "EMAIL_ALREADY_REGISTERED",
      });
    }
    console.log(`✅ [EMAIL CHECK] Email is new (not registered)`);

    // ✅ CHECK 2: Is there already a pending OTP?
    console.log(`   🔍 [CHECK 2] Checking for pending OTP...`);
    const hasPendingOTP = await hasActivePendingOTP(normalizedEmail, "signup");
    if (hasPendingOTP) {
      const remainingTime = await getOTPRemainingTime(normalizedEmail, "signup");
      console.log(`⚠️  [PENDING OTP] OTP already exists. Wait time: ${remainingTime}s`);
      return res.status(429).json({
        success: false,
        message: `OTP already sent. Please wait ${remainingTime} seconds or check your email.`,
        code: "OTP_ALREADY_SENT",
        remainingTime,
      });
    }
    console.log(`✅ [PENDING CHECK] No pending OTP found`);

    // ✅ CREATE OTP
    console.log(`\n   🔐 [OTP GENERATION] Creating new OTP...`);
    const otpResult = await createOTP(normalizedEmail, "signup");
    if (!otpResult.success) {
      console.log(`❌ [OTP GENERATION] Failed to create OTP`);
      return res.status(500).json({
        success: false,
        message: "Failed to generate OTP",
      });
    }
    console.log(`✅ [OTP GENERATED] OTP created successfully`);
    console.log(`   OTP Expires At: ${otpResult.expiresAt}`);
    console.log(`   Expiry Timestamp: ${new Date(otpResult.expiresAt).toISOString()}`);
    // ✅ SEND EMAIL with OTP code (use plain code returned by createOTP)
    const codeToSend = otpResult.code; // plain code returned for emailing only
    console.log(`\n   📧 [EMAIL SEND] Preparing to send OTP email (signup)...`);
    try {
      console.log(`   ⏱️  [EMAIL SEND] Calling Nodemailer sendOTPEmail()`);
      await sendOTPEmail(normalizedEmail, codeToSend, "signup");
      console.log(`✅ [EMAIL SENT] OTP email sent successfully`);
    } catch (emailError) {
      console.log(`❌ [EMAIL SEND FAILED] Error during email send: ${emailError.message}`);
      
      // Delete OTP if email fails to send
      console.log(`   🗑️  [CLEANUP] Deleting OTP record due to email failure...`);
      await deleteOTP(normalizedEmail, "signup");
      console.log(`   ✅ [CLEANUP] OTP deleted`);
      
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
        error: emailError.message,
      });
    }

    // ✅ SUCCESS
    console.log(`\n✨ [SUCCESS] OTP signup request completed successfully`);
    console.log(`   Email: ${normalizedEmail}`);
    console.log(`   OTP sent to email (value not logged)`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);
    
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email. Valid for 5 minutes.",
      email: normalizedEmail,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error(`\n❌ [SIGNUP OTP ERROR] Unexpected error`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`═══════════════════════════════════════════════════════════════\n`);
    
    return res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};

// ============================================================================
// ENDPOINT 2: VERIFY SIGNUP OTP
// ============================================================================
/**
 * POST /api/auth/otp/verify-signup-otp
 * 
 * Purpose: Verify OTP and create new user account
 * 
 * Request:
 * {
 *   "email": "user@gmail.com",
 *   "otp": "123456",
 *   "name": "John Doe",
 *   "username": "johndoe" (optional)
 * }
 * 
 * Responses:
 * - 201: User created, returns token
 * - 400: Invalid OTP, missing fields
 * - 409: User already registered (shouldn't happen if flow is correct)
 */
export const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp, name, username, role } = req.body;

    console.log(`[SIGNUP OTP] Request body received:`, { email, otp: '***', name, username, role });

    // ✅ Validate required fields
    if (!email || !otp || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and name are required",
      });
    }

    // ✅ Validate and normalize role
    // Accept 'reader', 'author', or 'writer' (convert writer → author)
    let userRole = role ? role.toLowerCase().trim() : 'reader';
    
    console.log(`[SIGNUP OTP] Initial role value: '${role}' (type: ${typeof role})`);
    console.log(`[SIGNUP OTP] After lowercase/trim: '${userRole}'`);
    
    // ✅ Convert 'writer' to 'author' for backward compatibility
    if (userRole === 'writer') {
      userRole = 'author';
      console.log(`[SIGNUP OTP] Converted 'writer' to 'author'`);
    }
    
    if (!['reader', 'author'].includes(userRole)) {
      console.warn(`[SIGNUP OTP] Invalid role '${userRole}', defaulting to 'reader'`);
      userRole = 'reader'; // default fallback
    }
    console.log(`[SIGNUP OTP] Role received: '${role}' → normalized to: '${userRole}'`);

    // ✅ NORMALIZE email
    const normalizedEmail = email.toLowerCase().trim();
    const otpCode = otp.trim();

    // ✅ VERIFY OTP CODE
    const verifyResult = await verifyOTPCode(normalizedEmail, otpCode, "signup");
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        attemptsRemaining: verifyResult.attemptsRemaining,
      });
    }

    // ✅ CHECK: Email still not registered (race condition check)
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      await deleteOTP(normalizedEmail, "signup");
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // ✅ CREATE NEW USER
    // For passwordless OTP signup, generate a secure random password and store its hash
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      username: username ? username.toLowerCase().trim() : normalizedEmail.split("@")[0],
      password: hashedPassword,
      role: userRole,
      isEmailVerified: true, // Email is verified via OTP
      isActive: true,
      isApproved: true,
    });

    console.log(`[SIGNUP OTP] User created with role: '${newUser.role}'`);

    // ✅ DELETE OTP after successful use
    await deleteOTP(normalizedEmail, "signup");

    // ✅ GENERATE JWT TOKEN (includes role)
    const token = generateToken(newUser);

    // ✅ SUCCESS
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Error verifying signup OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};

export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ✅ Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // ✅ NORMALIZE
    const normalizedEmail = email.toLowerCase().trim();
    const otpCode = otp.trim();

    // ✅ VERIFY OTP CODE
    const verifyResult = await verifyOTPCode(normalizedEmail, otpCode, "login");
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        attemptsRemaining: verifyResult.attemptsRemaining,
      });
    }

    // ✅ FETCH USER from database (use DB role, not token role)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      await deleteOTP(normalizedEmail, "login");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(`[LOGIN OTP] User found with role: '${user.role}'`);

    // ✅ Check user is still active
    if (!user.isActive) {
      await deleteOTP(normalizedEmail, "login");
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // ✅ DELETE OTP after successful use
    await deleteOTP(normalizedEmail, "login");

    // ✅ GENERATE JWT TOKEN with DB role
    const token = generateToken(user);

    // ✅ SUCCESS
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error verifying login OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

// ============================================================================
// ENDPOINT 3: SEND OTP FOR LOGIN
// ============================================================================
/**
 * POST /api/auth/otp/send-login-otp
 * 
 * Purpose: Send OTP to registered email for login
 * 
 * Request:
 * {
 *   "email": "user@gmail.com"
 * }
 * 
 * Responses:
 * - 200: OTP sent successfully
 * - 400: Invalid email
 * - 404: User not found
 * - 403: User account is inactive
 * - 429: Too many OTP requests
 */
export const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const requestTimestamp = new Date().toISOString();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`🔐 [LOGIN OTP - SEND] New OTP request`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Timestamp: ${requestTimestamp}`);
    console.log(`═══════════════════════════════════════════════════════════════`);

    // ✅ Validate input
    if (!email || !email.trim()) {
      console.log(`❌ [VALIDATION] Email is required`);
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // ✅ NORMALIZE
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`   📧 Email provided: ${email}`);
    console.log(`   📧 Email normalized: ${normalizedEmail}`);

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.log(`❌ [VALIDATION] Invalid email format: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    console.log(`✅ [VALIDATION] Email format valid`);

    // 🔴 CHECK 1: Is email REGISTERED?
    // For LOGIN, email MUST exist (opposite of signup)
    console.log(`\n   🔍 [CHECK 1] Checking if user exists...`);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`❌ [USER CHECK] User not found: ${normalizedEmail}`);
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
        code: "USER_NOT_FOUND",
      });
    }
    console.log(`✅ [USER CHECK] User found: ${user._id}`);

    // ✅ CHECK 2: Is user active?
    console.log(`   🔍 [CHECK 2] Checking if account is active...`);
    if (!user.isActive) {
      console.log(`❌ [ACTIVE CHECK] Account is inactive: ${normalizedEmail}`);
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
        code: "ACCOUNT_INACTIVE",
      });
    }
    console.log(`✅ [ACTIVE CHECK] Account is active`);

    // ✅ CHECK 3: Is there already a pending OTP?
    console.log(`   🔍 [CHECK 3] Checking for pending OTP...`);
    const hasPendingOTP = await hasActivePendingOTP(normalizedEmail, "login");
    if (hasPendingOTP) {
      const remainingTime = await getOTPRemainingTime(normalizedEmail, "login");
      console.log(`⚠️  [PENDING OTP] OTP already exists. Wait time: ${remainingTime}s`);
      return res.status(429).json({
        success: false,
        message: `OTP already sent. Please wait ${remainingTime} seconds.`,
        code: "OTP_ALREADY_SENT",
        remainingTime,
      });
    }
    console.log(`✅ [PENDING CHECK] No pending OTP found`);

    // ✅ CREATE OTP
    console.log(`\n   🔐 [OTP GENERATION] Creating new OTP...`);
    const otpResult = await createOTP(normalizedEmail, "login");
    if (!otpResult.success) {
      console.log(`❌ [OTP GENERATION] Failed to create OTP`);
      return res.status(500).json({
        success: false,
        message: "Failed to generate OTP",
      });
    }
    console.log(`✅ [OTP GENERATED] OTP created successfully`);
    console.log(`   OTP Expires At: ${otpResult.expiresAt}`);
    // ✅ SEND EMAIL with OTP code (use plain code returned by createOTP)
    const codeToSend = otpResult.code;
    console.log(`\n   📧 [EMAIL SEND] Preparing to send OTP email (login)...`);
    try {
      console.log(`   ⏱️  [EMAIL SEND] Calling Nodemailer sendOTPEmail()`);
      await sendOTPEmail(normalizedEmail, codeToSend, "login");
      console.log(`✅ [EMAIL SENT] OTP email sent successfully`);
    } catch (emailError) {
      console.log(`❌ [EMAIL SEND FAILED] Error during email send: ${emailError.message}`);
      
      // Delete OTP if email fails
      console.log(`   🗑️  [CLEANUP] Deleting OTP record due to email failure...`);
      await deleteOTP(normalizedEmail, "login");
      console.log(`   ✅ [CLEANUP] OTP deleted`);
      
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
        error: emailError.message,
      });
    }

    // ✅ SUCCESS
    console.log(`\n✨ [SUCCESS] OTP login request completed successfully`);
    console.log(`   Email: ${normalizedEmail}`);
    console.log(`   OTP sent to email (value not logged)`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);
    
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email. Valid for 5 minutes.",
      email: normalizedEmail,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    console.error(`\n❌ [LOGIN OTP ERROR] Unexpected error`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`═══════════════════════════════════════════════════════════════\n`);
    
    return res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};


