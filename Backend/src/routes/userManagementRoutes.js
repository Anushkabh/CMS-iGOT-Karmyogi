const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt");
const { AppError } = require("../middleware/errorHandler");
const { mongoIdParam } = require("../middleware/validators");

const router = express.Router();

// Get All Users - depending on user's role
router.get("/users", authMiddleware(["super admin", "admin"]), async (req, res, next) => {
  try {
    let users;
    if (req.user.role === "super admin") {
      users = await User.find().select("-password");
    } else if (req.user.role === "admin") {
      users = await User.find({ role: { $in: ["editor"] } }).select("-password");
    } else {
      users = [];
    }
    res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
});

// Get User by ID
router.get("/users/:id", authMiddleware(["super admin", "admin"]), mongoIdParam, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) throw new AppError("User not found", 404);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Delete User by ID
router.delete("/users/:id", authMiddleware(["super admin", "admin"]), mongoIdParam, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new AppError("User not found", 404);
    res.status(200).json({ success: true, data: { message: "User deleted successfully" } });
  } catch (error) {
    next(error);
  }
});

// Update User by ID
router.put("/users/:id", authMiddleware(["super admin", "admin"]), mongoIdParam, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError("User not found", 404);

    const { name, email, phone, role } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;

    await user.save();
    res.status(200).json({ success: true, data: { message: "User updated successfully" } });
  } catch (error) {
    next(error);
  }
});

// Update User Password by only Super Admin
router.put(
  "/users/:id/password",
  authMiddleware(["super admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 8) {
        throw new AppError("Password is required and must be at least 8 characters", 400);
      }

      const user = await User.findById(req.params.id);
      if (!user) throw new AppError("User not found", 404);

      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
      await user.save();

      res.status(200).json({ success: true, data: { message: "User password updated successfully" } });
    } catch (error) {
      next(error);
    }
  }
);

// Activate User by ID
router.put(
  "/users/:id/activate",
  authMiddleware(["super admin", "admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError("User not found", 404);

      user.status = "active";
      await user.save();

      res.status(200).json({ success: true, data: { message: "User activated successfully" } });
    } catch (error) {
      next(error);
    }
  }
);

// Deactivate User by ID
router.put(
  "/users/:id/deactivate",
  authMiddleware(["super admin", "admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError("User not found", 404);

      user.status = "deactive";
      await user.save();

      res.status(200).json({ success: true, data: { message: "User deactivated successfully" } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
