const jwt = require("jsonwebtoken");
const User = require("../models/User");

const secretKey = process.env.JWT_SECRET;

const authMiddleware = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ success: false, error: "Authorization token is required" });
      }

      const decoded = jwt.verify(token, secretKey);

      if (!decoded.email || !decoded.role || !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ success: false, error: "Insufficient permissions" });
      }

      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        return res.status(401).json({ success: false, error: "User not found" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ success: false, error: "Account is deactivated" });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, error: "Token has expired" });
      }
      res.status(401).json({ success: false, error: "Invalid token" });
    }
  };
};

module.exports = authMiddleware;
