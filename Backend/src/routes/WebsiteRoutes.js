const express = require("express");
const { Storage } = require("@google-cloud/storage");
const Website = require("../models/Website");
const authMiddleware = require("../middleware/authMiddleware");
const { AppError } = require("../middleware/errorHandler");
const { websiteValidation, mongoIdParam } = require("../middleware/validators");
const logger = require("../utils/logger");

const router = express.Router();
const storage = new Storage({ keyFilename: process.env.GCS_KEY_FILE || "./key.json" });

// Create a new website and bucket
router.post("/", authMiddleware(["super admin", "admin"]), websiteValidation, async (req, res, next) => {
  const { name, url, bucketName } = req.body;
  try {
    await storage.createBucket(bucketName);

    const website = new Website({ name, url, bucketName });
    await website.save();

    res.status(201).json({ success: true, data: website });
  } catch (error) {
    if (error.code === 409) {
      return next(new AppError("Bucket already exists", 409));
    }
    next(error);
  }
});

// Get all websites
router.get("/", authMiddleware(["super admin", "admin", "editor"]), async (req, res, next) => {
  try {
    const websites = await Website.find();
    res.status(200).json({ success: true, data: websites });
  } catch (error) {
    next(error);
  }
});

// Get a single website by ID
router.get("/:id", authMiddleware(["super admin", "admin", "editor"]), mongoIdParam, async (req, res, next) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) throw new AppError("Website not found", 404);
    res.status(200).json({ success: true, data: website });
  } catch (error) {
    next(error);
  }
});

// Update a website by ID
router.put("/:id", authMiddleware(["super admin", "admin"]), mongoIdParam, async (req, res, next) => {
  const { bucketName } = req.body;
  try {
    const website = await Website.findById(req.params.id);
    if (!website) throw new AppError("Website not found", 404);

    if (bucketName && bucketName !== website.bucketName) {
      await storage.createBucket(bucketName);
      await storage.bucket(website.bucketName).delete();
      website.bucketName = bucketName;
    }

    Object.assign(website, req.body);
    await website.save();

    res.status(200).json({ success: true, data: website });
  } catch (error) {
    next(error);
  }
});

// Delete a website and its bucket by ID
router.delete("/:id", authMiddleware(["super admin", "admin"]), mongoIdParam, async (req, res, next) => {
  try {
    const website = await Website.findByIdAndDelete(req.params.id);
    if (!website) throw new AppError("Website not found", 404);

    await storage.bucket(website.bucketName).delete();

    res.status(200).json({ success: true, data: { message: "Website and bucket deleted" } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
