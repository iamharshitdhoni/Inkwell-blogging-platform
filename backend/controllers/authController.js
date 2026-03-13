import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ============================================================================
// HELPER FUNCTION: Generate JWT Token
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
// HELPER FUNCTION: Validate Input
// ============================================================================
const validateSignupInput = (name, email, password) => {
  if (!name || !email || !password) {
    return { isValid: false, message: "Please provide name, email, and password" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  if (password.length < 6) {
    return { isValid: false, message: "Password must be at least 6 characters" };
  }

  return { isValid: true };
};

// ============================================================================
// USER SIGNUP - ACCEPTS ROLE FROM REQUEST BODY
// ============================================================================
/**
 * Complete signup endpoint that handles role-based registration
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "SecurePass123",
 *   "role": "reader" or "author" (optional, defaults to "reader")
 * }
 */
export const signupUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ✅ Validate input
    const validation = validateSignupInput(name, email, password);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    // ✅ NORMALIZE: Lowercase and trim email
    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Check if user already exists (with normalized email)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // ✅ VALIDATE AND NORMALIZE ROLE
    // Accept role from request, default to "reader" if not provided
    let userRole = "reader"; // Default role

    if (role) {
      const normalizedRole = role.toLowerCase().trim();
      // Only allow "reader" and "author" for user signup
      if (['reader', 'author'].includes(normalizedRole)) {
        userRole = normalizedRole;
      } else {
        return res.status(400).json({ 
          success: false,
          message: "Invalid role. Must be 'reader' or 'author'" 
        });
      }
    }

    console.log(`[SIGNUP] User registering with role: '${userRole}'`);

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user with ROLE FROM REQUEST
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,  // ✅ ACCEPTS FROM REQUEST (OR DEFAULTS TO "reader")
      isActive: true,
      isApproved: userRole === 'reader' ? true : false,  // Authors may need approval
      username: normalizedEmail.split("@")[0],
      createdAt: new Date()
    });

    // ✅ Generate token (includes role in payload)
    const token = generateToken(user);

    console.log(`[SIGNUP] User created and JWT generated with role: '${user.role}'`);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,  // ✅ CRITICAL: Return role in response
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message
    });
  }
};

// ============================================================================
// USER LOGIN
// ============================================================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // ✅ NORMALIZE: Lowercase and trim email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email (normalized)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // Generate token (includes role from database)
    const token = generateToken(user);

    console.log(`[LOGIN] User logged in with role from DB: '${user.role}'`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,  // ✅ CRITICAL: Return database role, not hardcoded role
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message
    });
  }
};

// ============================================================================
// AUTHOR SIGNUP (Creates user with 'writer' role)
// ============================================================================
export const signupAuthor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const validation = validateSignupInput(name, email, password);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    // ✅ NORMALIZE: Lowercase and trim email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user with "author" role
    // Note: Always save as 'author' regardless of input (backward compatible with 'writer')
    const author = await User.create({
      name,
      email: normalizedEmail,  // ✅ Store normalized email
      password: hashedPassword,
      role: "author",  // ✅ Always saves as 'author' (accepts 'writer' or 'author' from frontend)
      isActive: true,
      isApproved: false,
      username: normalizedEmail.split("@")[0],
      createdAt: new Date()
    });

    console.log(`[SIGNUP] Author created with role: '${author.role}'`);

    // Generate token (includes role in payload)
    const token = generateToken(author);

    console.log(`[SIGNUP] JWT token generated with role: '${author.role}'`);

    res.status(201).json({
      success: true,
      message: "Author account created. Waiting for admin approval.",
      token,
      user: {
        _id: author._id,
        name: author.name,
        email: author.email,
        role: author.role,  // ✅ CRITICAL: Return role in response so frontend knows the role
        username: author.username,
        isApproved: author.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering author",
      error: error.message
    });
  }
};

// ============================================================================
// AUTHOR LOGIN (Authenticates user and returns their role)
// ============================================================================
export const loginAuthor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // ✅ NORMALIZE: Lowercase and trim email
    const normalizedEmail = email.toLowerCase().trim();

    // ✅ FIXED: Find user by email ONLY (don't hardcode role to "author")
    // This allows any user (reader/writer/admin) to login
    // The actual role will be fetched from the database and included in JWT
    const author = await User.findOne({ email: normalizedEmail });
    if (!author) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Verify user is a writer (not just any user)
    if (author.role !== 'writer') {
      return res.status(403).json({ message: "This endpoint is for writers only" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, author.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if author is active
    if (!author.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // Generate token
    const token = generateToken(author);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: author._id,
        name: author.name,
        email: author.email,
        role: author.role,
        username: author.username,
        isApproved: author.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message
    });
  }
};

// ============================================================================
// ADMIN SIGNUP (Protected - Admin Only)
// ============================================================================
export const signupAdmin = async (req, res) => {
  try {
    // Verify requester is admin (middleware ensures authentication)
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create admin accounts."
      });
    }

    const { name, email, password } = req.body;

    // Validate input
    const validation = validateSignupInput(name, email, password);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    // ✅ NORMALIZE: Lowercase and trim email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin with "admin" role
    const admin = await User.create({
      name,
      email: normalizedEmail,  // ✅ Store normalized email
      password: hashedPassword,
      role: "admin",
      isActive: true,
      isApproved: true,
      username: normalizedEmail.split("@")[0],
      createdAt: new Date()
    });

    // Generate token
    const token = generateToken(admin);

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        username: admin.username
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating admin account",
      error: error.message
    });
  }
};

// ============================================================================
// ADMIN LOGIN
// ============================================================================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // ✅ NORMALIZE: Lowercase and trim email
    const normalizedEmail = email.toLowerCase().trim();

    // Find admin by email
    const admin = await User.findOne({ email: normalizedEmail, role: "admin" });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // Generate token
    const token = generateToken(admin);

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        username: admin.username
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message
    });
  }
};
