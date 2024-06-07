const jwt = require("jsonwebtoken");
const secretKey = "admin@123";

const Admin = require("../models/User");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    // Extracting token from the request headers
    const token = req.headers.authorization;

    // If token is not provided, return unauthorized status
    if (!token) {
      return res.status(401).json({ error: "Authorization token is required" });
    }

    // Verifying token
    const decoded = jwt.verify(token, secretKey);

    // Check if the decoded token contains a valid email and role
    if (!decoded.email || !decoded.role || !decoded.role.includes("Admin")) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if the admin exists
    const admin = await Admin.findOne({ email: decoded.email });
    if (!admin) {
      return res.status(401).json({ error: "Admin not found" });
    }

    // Attaching the admin object to the request for further use in routes
    req.admin = admin;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = adminAuthMiddleware;
