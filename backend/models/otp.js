import mongoose from "mongoose";

/**
 * OTP Model
 * Stores temporary OTP codes for email-based authentication
 * 
 * Flow:
 * 1. User requests OTP with email
 * 2. OTP is generated (6 digits) and stored with 5-minute expiry
 * 3. User receives OTP via email
 * 4. User verifies OTP
 * 5. OTP record is deleted after successful verification or expiry
 */
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true, // For quick lookup
    },
    code: {
      type: String,
      required: true, // 6-digit numeric string
    },
    type: {
      type: String,
      enum: ["signup", "login", "reset"], // Different OTP purposes
      default: "signup",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-delete after expiry (TTL index)
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5, // Max 5 verification attempts
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for email + type for faster lookups
otpSchema.index({ email: 1, type: 1 });

// Pre-save middleware to ensure email is always lowercase
// Use a synchronous hook (no `next` callback) to avoid callback-style issues
otpSchema.pre("save", function () {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
