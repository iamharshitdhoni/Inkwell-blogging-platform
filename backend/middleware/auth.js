import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    console.warn(`[AUTH MIDDLEWARE] ❌ No token provided in Authorization header`);
    return res.status(401).json({
      success: false,
      message: "Authorization token is required"
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support multiple token payload formats for resilience (id, userId, _id)
    const userId = decoded?.id || decoded?.userId || decoded?._id || decoded?.user_id;
    const role = decoded?.role;
    const email = decoded?.email;

    console.log(`[AUTH MIDDLEWARE] Token decoded - userId: ${userId}, email: ${email}, role from JWT: '${role}'`);

    // Find user by ID from token
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[AUTH MIDDLEWARE] ❌ User not found in database for ID: ${userId}`);
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`[AUTH MIDDLEWARE] ✅ User authenticated: ${user.email}, role in DB: '${user.role}'`);

    // Verify role consistency - DB role takes precedence
    if (role && user.role !== role) {
      console.warn(`[AUTH MIDDLEWARE] ⚠️  Role mismatch for user ${user.email}: JWT='${role}', DB='${user.role}'. Using DB role as source of truth.`);
    }

    // Check if user is active
    if (!user.isActive) {
      console.warn(`[AUTH MIDDLEWARE] ❌ User account is deactivated: ${user.email}`);
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated"
      });
    }

    // Attach user to request (with DB role)
    req.user = user;
    next();
  } catch (error) {
    console.error(`[AUTH MIDDLEWARE] ❌ Token verification failed: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message
    });
  }
};
