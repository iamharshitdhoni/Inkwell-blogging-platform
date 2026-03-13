// Middleware to check if user has required role
export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user; // Set by protect middleware

    if (!user) {
      console.warn(`[ROLE MIDDLEWARE] ❌ No user found in request (not authenticated)`);
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }

    console.log(`[ROLE MIDDLEWARE] Checking user '${user.email}' with role '${user.role}' against allowed roles: [${allowedRoles.join(', ')}]`);

    if (!allowedRoles.includes(user.role)) {
      console.warn(`[ROLE MIDDLEWARE] ❌ Access denied for user '${user.email}': role '${user.role}' not in ${JSON.stringify(allowedRoles)}`);
      return res.status(403).json({ 
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${user.role}` 
      });
    }

    console.log(`[ROLE MIDDLEWARE] ✅ Access granted for user '${user.email}' with role '${user.role}'`);
    next();
  };
};

// Middleware to check if user is author of a resource
export const isAuthor = (modelName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { id } = req.params;

      // Dynamically import the model
      const Model = (await import(`../models/${modelName}.js`)).default;
      const resource = await Model.findById(id);

      if (!resource) {
        return res.status(404).json({ message: `${modelName} not found` });
      }

      if (resource.author.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "You are not the author of this resource" });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};
