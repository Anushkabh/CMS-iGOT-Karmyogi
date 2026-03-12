const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { sendEmail } = require("./sendEmail");
const { newUserHTMLTemplate } = require("./emailTemplates/newUserHTMLTemplate");
const { AppError } = require("../middleware/errorHandler");
const {
  loginValidation,
  addSuperAdminValidation,
  addUserValidation,
  changePasswordValidation,
  updateUserDetailValidation,
} = require("../middleware/validators");

const router = express.Router();
const secretKey = process.env.JWT_SECRET;

// Super Admin Registration
router.post("/addSuperAdmin", addSuperAdminValidation, async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      status: "active",
      role: "super admin",
    });

    await newUser.save();

    const token = jwt.sign(
      { email: newUser.email, name: newUser.name, role: newUser.role },
      secretKey,
      { expiresIn: "1w" }
    );

    res.status(201).json({ success: true, data: { message: "Super admin registered successfully", token } });
  } catch (error) {
    next(error);
  }
});

// User Registration (only accessible by super admins and admins)
router.post("/addNewUser", authMiddleware(["super admin", "admin"]), addUserValidation, async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      phone,
      status: "active",
      password: hashedPassword,
      role,
    });

    const subject = "Welcome to the iGOT KarmaYogi!";
    const userEmailTemplateHtml = newUserHTMLTemplate({ name, email, phone, password, role });
    const emailSend = await sendEmail(email, subject, userEmailTemplateHtml);

    if (!emailSend) {
      throw new AppError("Failed to send welcome email", 500);
    }

    await newUser.save();

    const token = jwt.sign(
      { email: newUser.email, name: newUser.name, role: newUser.role },
      secretKey,
      { expiresIn: "1w" }
    );

    res.status(201).json({ success: true, data: { message: "User registered successfully", token } });
  } catch (error) {
    next(error);
  }
});

// User Login
router.post("/login", loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== "active") {
      throw new AppError("User account is not active", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign(
      { name: user.name, email: user.email, role: user.role },
      secretKey,
      { expiresIn: "1w" }
    );

    res.status(200).json({ success: true, data: { message: "Login successful", token } });
  } catch (error) {
    next(error);
  }
});

// Fetch user details
router.get("/userDetails", authMiddleware(["editor", "admin", "super admin"]), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-password");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

// Change Password
router.post("/changePassword", authMiddleware(["editor", "admin", "super admin"]), changePasswordValidation, async (req, res, next) => {
  try {
    const { userID, oldPassword, newPassword } = req.body;

    const user = await User.findById(userID);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new AppError("Old password is incorrect", 401);
    }

    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    res.status(200).json({ success: true, data: { message: "Password changed successfully" } });
  } catch (error) {
    next(error);
  }
});

// Update user details
router.put("/usersDetailUpdate/:id", authMiddleware(["editor", "admin", "super admin"]), updateUserDetailValidation, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { name, email, phone } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    await user.save();

    res.status(200).json({ success: true, data: { message: "User updated successfully" } });
  } catch (error) {
    next(error);
  }
});



module.exports = router;
