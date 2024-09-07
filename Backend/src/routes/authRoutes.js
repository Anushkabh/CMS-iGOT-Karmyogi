const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { sendEmail } = require("./sendEmail");
const {newUserHTMLTemplate} = require('./emailTemplates/newUserHTMLTemplate')

const router = express.Router();
const secretKey = "admin123";

// Super Admin Registration
router.post("/addSuperAdmin", async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Checking if all required fields are provided
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Checking if the provided email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Hashing the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new super admin user
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      status: "active",
      role: "super admin",
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { email: newUser.email, role: newUser.role },
      secretKey,
      { expiresIn: "1w" }
    );

    res
      .status(201)
      .json({ message: "Super admin registered successfully", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Registration (only accessible by super admins)
router.post("/addNewUser", authMiddleware(["super admin", "admin"]), async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if the provided email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user
    const newUser = new User({
      name,
      email,
      phone,
      status: "active",
      password: hashedPassword,
      role,
    });
  
    const subject = "Welcome to the iGOT KarmaYogi!";
    
    const userEmailTemplateHtml = newUserHTMLTemplate({name,email,phone,password,role})

    const emailSend = await sendEmail(email,subject,userEmailTemplateHtml);

    if (!emailSend) {
      console.log("Failed to send email & adding user");
      return res
      .status(500)
      .json({ error: "Failed to send email & adding user" });
    }
    
    await newUser.save();

    // Generating JWT token
    const token = jwt.sign(
      { email: newUser.email, role: newUser.role },
      secretKey,
      { expiresIn: "1w" }
    );

    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // If user not found, return error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is active
    if (user.status !== "active") {
      return res.status(403).json({ message: "User account is not active" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If password is invalid, return error
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { name: user.name, email: user.email, role: user.role },
      secretKey,
      {
        expiresIn: "1w",
      }
    );

    // Return token
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch user details
router.get("/userDetails", authMiddleware(["user", "admin", "super admin"]), async (req, res) => {
  try {
    // Get the user email from the decoded token (handled by authMiddleware)
    const email = req.user.email;

    // Find the user by email in the database
    const user = await User.findOne({ email });

    // If user not found, return an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user's details
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});


module.exports = router;
