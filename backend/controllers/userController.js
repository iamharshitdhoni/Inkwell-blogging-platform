import User from "../models/userModel.js";
import Blog from "../models/blogs.js";
import Comment from "../models/comments.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateVerificationToken, getTokenExpiry, isTokenExpired } from "../utils/tokenUtils.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../services/emailService.js";

// Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // ✅ NORMALIZE: Lowercase and trim email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (with normalized email)
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    const user = await User.create({ 
      name, 
      email: normalizedEmail,  // ✅ Store normalized email
      password: hashedPassword,
      role: 'user',
      username: normalizedEmail.split('@')[0],
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: tokenExpiry
    });
    
    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, verificationToken);
    } catch (emailError) {
      console.error('Email send error:', emailError.message);
      // Continue anyway - user is registered, they can request email resend
    }

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // ✅ NORMALIZE: Lowercase and trim email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user (with normalized email)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: "Please verify your email first",
        isEmailVerified: false,
        email: user.email
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Create JWT with consistent fields
    const token = jwt.sign(
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

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, avatar } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username is unique (if being changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username;
    }

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search Users by name or username
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    console.log("Searching for users with query:", query);

    // Search by name or username (case-insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    })
      .select("-password")
      .limit(10);

    console.log("Search results found:", users.length);
    res.status(200).json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Change user role
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['reader', 'author', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'reader', 'author', or 'admin'" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "User role updated successfully",
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Block/Unblock user
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user stats for author dashboard
export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const blogs = await Blog.find({ author: id });
    const totalBlogs = blogs.length;
    const totalLikes = blogs.reduce((sum, blog) => sum + (blog.likes?.length || 0), 0);
    const totalComments = await Comment.countDocuments({ blog: { $in: blogs.map(b => b._id) } });

    res.status(200).json({
      user,
      stats: {
        totalBlogs,
        totalLikes,
        totalComments
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// SIGNUP MODULES - Three separate signup routes for different user types
// ============================================================================

/**
 * SIGNUP MODULE 1: Normal User Signup
 * - Public endpoint
 * - Creates a regular user account (role: "user")
 * - Cannot write blogs, can only read and comment
 * - Role is automatically assigned and cannot be overridden from request
 */
export const signupUser = async (req, res) => {
  try {
    let { name, email, password, username } = req.body;
    // Accept either `name` or `username` for compatibility with frontend
    if (!name && username) name = username;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["name", "email", "password"]
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username: name }] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email or username" });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role "reader" (ROLE CANNOT BE OVERRIDDEN)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "reader", // Automatically assigned - cannot be changed from request
      isActive: true,
      username: email.split("@")[0] // Generate username from email
    });

    // Generate JWT token
    const token = jwt.sign(
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

    return res.status(201).json({
      message: "User account created successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('signupUser error:', error && error.stack ? error.stack : error);
    res.status(500).json({ 
      message: "Error creating user account",
      error: error.message 
    });
  }
};

/**
 * SIGNUP MODULE 2: Author Signup
 * - Public endpoint
 * - Creates an author account (role: "author")
 * - Can write blogs (requires approval by admin)
 * - Role is automatically assigned and cannot be overridden from request
 */
export const signupAuthor = async (req, res) => {
  try {
    let { name, email, password, username } = req.body;
    if (!name && username) name = username;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["name", "email", "password"]
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username: name }] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email or username" });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create author with role "author" (ROLE CANNOT BE OVERRIDDEN)
    const author = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "author", // Automatically assigned - cannot be changed from request
      isApproved: false, // Author blogs require admin approval
      isActive: true,
      username: email.split("@")[0] // Generate username from email
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: author._id.toString(),
        userId: author._id.toString(),
        _id: author._id.toString(),
        email: author.email, 
        role: author.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Author account created successfully. Your blogs will require admin approval.",
      token,
      user: {
        _id: author._id,
        name: author.name,
        email: author.email,
        username: author.username,
        role: author.role,
        isApproved: author.isApproved,
        avatar: author.avatar
      }
    });
  } catch (error) {
    console.error('signupAuthor error:', error && error.stack ? error.stack : error);
    res.status(500).json({ 
      message: "Error creating author account",
      error: error.message 
    });
  }
};

/**
 * SIGNUP MODULE 3: Admin Signup
 * - PROTECTED endpoint (admin-only)
 * - Only existing admins can create new admin accounts
 * - Creates an admin account (role: "admin")
 * - Has full platform control and moderation powers
 * - Role is automatically assigned and cannot be overridden from request
 */
export const signupAdmin = async (req, res) => {
  try {
    // Check if requester is admin (middleware ensures authentication)
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        message: "Access denied. Only admins can create admin accounts.",
        requiredRole: "admin"
      });
    }

    let { name, email, password, username } = req.body;
    if (!name && username) name = username;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["name", "email", "password"]
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username: name }] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email or username" });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin with role "admin" (ROLE CANNOT BE OVERRIDDEN)
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin", // Automatically assigned - cannot be changed from request
      isActive: true,
      username: email.split("@")[0], // Generate username from email
      createdBy: req.user._id // Track which admin created this admin
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id.toString(),
        userId: admin._id.toString(),
        _id: admin._id.toString(),
        email: admin.email, 
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Admin account created successfully",
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        avatar: admin.avatar,
        createdBy: req.user.name
      }
    });
  } catch (error) {
    console.error('signupAdmin error:', error && error.stack ? error.stack : error);
    res.status(500).json({ 
      message: "Error creating admin account",
      error: error.message 
    });
  }
};

/**
 * ADMIN DASHBOARD
 * - Returns platform statistics and pending approvals
 * - Admin-only endpoint
 */
export const getAdminDashboard = async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access denied. Only admins can view this dashboard.",
        requiredRole: "admin"
      });
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const authorsCount = await User.countDocuments({ role: 'author' });
    const normalUsersCount = await User.countDocuments({ role: 'reader' });
    const adminsCount = await User.countDocuments({ role: 'admin' });
    const blockedUsersCount = await User.countDocuments({ isActive: false });

    // Get blog statistics
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ status: 'published', isApproved: true });
    const draftBlogs = await Blog.countDocuments({ status: 'draft' });
    const pendingApprovalBlogs = await Blog.countDocuments({ isApproved: false });
    const archivedBlogs = await Blog.countDocuments({ status: 'archived' });

    // Get blogs pending approval
    const pendingBlogs = await Blog.find({ isApproved: false })
      .populate("author", "name email username role")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent authors
    const recentAuthors = await User.find({ role: 'author' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    res.status(200).json({
      userStats: {
        totalUsers,
        authorsCount,
        normalUsersCount,
        adminsCount,
        blockedUsersCount
      },
      blogStats: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        pendingApprovalBlogs,
        archivedBlogs
      },
      pendingBlogs,
      recentAuthors
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching admin dashboard",
      error: error.message 
    });
  }
};

/**
 * CHANGE USER ROLE
 * - Admin-only function to change user roles
 * - Prevents removing the last admin
 */
export const changeUserRoleEnhanced = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can change user roles" });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['reader', 'author', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'reader', 'author', or 'admin'" });
    }

    // Prevent self-demotion from admin
    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: "Cannot remove your own admin privileges" });
    }

    // Check if removing last admin
    if (role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 1 && id === req.user._id.toString()) {
        return res.status(400).json({ message: "Cannot remove the last admin from the system" });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * VERIFY EMAIL ENDPOINT
 * Used to verify user's email using the token sent in registration email
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Find user with matching token
    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    // Check if token has expired
    if (isTokenExpired(user.emailVerificationTokenExpiry)) {
      return res.status(400).json({ 
        message: "Verification token has expired. Please request a new one.",
        isExpired: true,
        email: user.email
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Welcome email send error:', emailError.message);
      // Continue anyway - user is verified
    }

    res.status(200).json({
      message: "Email verified successfully. You can now login.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * RESEND VERIFICATION EMAIL
 * Used to resend verification email if user didn't receive it
 */
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // ✅ NORMALIZE
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpiry = tokenExpiry;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, verificationToken);
    } catch (emailError) {
      console.error('Email send error:', emailError.message);
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    res.status(200).json({
      message: "Verification email sent successfully. Please check your email.",
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};