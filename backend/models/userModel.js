import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  usernameLower: { type: String, lowercase: true, index: true, sparse: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,  // ✅ NORMALIZE: Always store as lowercase
    trim: true,       // ✅ NORMALIZE: Remove whitespace
    index: true,      // ✅ Index for faster queries
  },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationTokenExpiry: { type: Date, default: null },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['reader', 'author', 'admin'], required: true, index: true },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: true }, // For authors awaiting approval
  bio: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Track which admin created this user
}, {
  timestamps: true,
});

// ✅ NORMALIZE: Ensure username and email are always lowercase and trimmed
userSchema.pre('save', function () {
  if (this.username) {
    this.usernameLower = this.username.toLowerCase();
  }
  // Ensure email is always normalized
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
});

const User = mongoose.model("User", userSchema);
export default User;