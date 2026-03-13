import OTP from "../models/otp.js";
import bcrypt from 'bcrypt';

/**
 * ============================================================================
 * OTP SERVICE - All OTP-related operations
 * ============================================================================
 */

/**
 * Generate a 6-digit random OTP code
 * Returns: "123456" (string format)
 */
export const generateOTPCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
};

/**
 * Create or update OTP for a user
 * Deletes old OTPs if they exist
 * Expiry: 5 minutes
 */
export const createOTP = async (email, type = "signup") => {
  try {
    // ✅ NORMALIZE: Always lowercase and trim email
    email = email.toLowerCase().trim();
    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type });

    // Generate new OTP code (plain for sending)
    const code = generateOTPCode();

    // Hash OTP before saving for security
    const hashed = await bcrypt.hash(code, 10);

    // Set expiry to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Create new OTP record with hashed code
    const otp = await OTP.create({
      email,
      code: hashed, // store hashed code
      type,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    return {
      success: true,
      email: otp.email,
      expiresAt: otp.expiresAt,
      // Return the plain code to the caller so it can be emailed.
      // IMPORTANT: Do NOT include this value in any HTTP responses sent to clients.
      code,
    };
  } catch (error) {
    console.error("Error creating OTP:", error && (error.stack || error.message) ? (error.stack || error.message) : String(error));
    return {
      success: false,
      message: "Failed to generate OTP",
      error: error && error.message ? error.message : String(error),
    };
  }
};

/**
 * Get active OTP for verification
 * Returns null if OTP doesn't exist or has expired
 */
export const getOTP = async (email, type = "signup") => {
  try {
    email = email.toLowerCase().trim();

    const otp = await OTP.findOne({
      email,
      type,
      expiresAt: { $gt: new Date() }, // Only not-expired OTPs
    });

    return otp;
  } catch (error) {
    console.error("Error fetching OTP:", error);
    return null;
  }
};

/**
 * Verify OTP code
 * Increments attempts and marks as verified if correct
 * Returns: { success: true/false, message: string }
 */
export const verifyOTPCode = async (email, code, type = "signup") => {
  try {
    email = email.toLowerCase().trim();
    code = code.trim(); // Remove any whitespace

    // Find OTP
    const otp = await getOTP(email, type);

    if (!otp) {
      return {
        success: false,
        message: "OTP not found or has expired. Please request a new one.",
      };
    }

    // Check if max attempts exceeded
    if (otp.attempts >= 5) {
      await OTP.deleteOne({ _id: otp._id });
      return {
        success: false,
        message: "Maximum verification attempts exceeded. Please request a new OTP.",
      };
    }

    // Verify code by comparing with hashed value
    const match = await bcrypt.compare(code, otp.code);
    if (!match) {
      otp.attempts += 1;
      await otp.save();
      return {
        success: false,
        message: `Invalid OTP. ${5 - otp.attempts} attempts remaining.`,
        attemptsRemaining: 5 - otp.attempts,
      };
    }

    // ✅ Code is correct
    otp.verified = true;
    await otp.save();

    return {
      success: true,
      message: "OTP verified successfully",
      email: otp.email,
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      success: false,
      message: "Error verifying OTP",
    };
  }
};

/**
 * Delete OTP after successful verification or use
 */
export const deleteOTP = async (email, type = "signup") => {
  try {
    email = email.toLowerCase().trim();
    await OTP.deleteMany({ email, type });
    return true;
  } catch (error) {
    console.error("Error deleting OTP:", error);
    return false;
  }
};

/**
 * Check if an email has a pending OTP
 * Used to prevent multiple OTP requests
 */
export const hasActivePendingOTP = async (email, type = "signup") => {
  try {
    email = email.toLowerCase().trim();
    const otp = await OTP.findOne({
      email,
      type,
      expiresAt: { $gt: new Date() },
      verified: false,
    });
    return !!otp;
  } catch (error) {
    console.error("Error checking pending OTP:", error);
    return false;
  }
};

/**
 * Get remaining time for OTP in seconds
 */
export const getOTPRemainingTime = async (email, type = "signup") => {
  try {
    const otp = await getOTP(email, type);
    if (!otp) return 0;

    const now = new Date();
    const remaining = Math.floor((otp.expiresAt - now) / 1000);
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error("Error getting OTP remaining time:", error);
    return 0;
  }
};
