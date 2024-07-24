const express = require("express");
const mongoose = require("mongoose");
const { Storage } = require("@google-cloud/storage");
const Website = require("../models/Website");

const router = express.Router();

const storage = new Storage({ keyFilename: "./key.json" });

// Create a new website and bucket
router.post("/", async (req, res) => {
  const { name, url, bucketName } = req.body;
  try {
    // Create bucket in GCP
    await storage.createBucket(bucketName);

    // Save website in MongoDB
    const website = new Website({ name, url, bucketName });
    await website.save();

    res.status(201).json(website);
  } catch (error) {
    console.error("Error creating website and bucket:", error);
    if (error.code === 409) {
      // Bucket already exists
      res.status(409).json({ message: "Bucket already exists" });
    } else {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
});

// Get all websites
router.get("/", async (req, res) => {
  try {
    const websites = await Website.find();
    res.status(200).json(websites);
  } catch (error) {
    console.error("Error fetching websites:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get a single website by ID
router.get("/:id", async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) return res.status(404).json({ message: "Website not found" });
    res.status(200).json(website);
  } catch (error) {
    console.error("Error fetching website:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a website by ID
router.put("/:id", async (req, res) => {
  const { bucketName } = req.body;
  try {
    const website = await Website.findById(req.params.id);
    if (!website) return res.status(404).json({ message: "Website not found" });

    // Update bucket name in GCP if changed
    if (bucketName && bucketName !== website.bucketName) {
      try {
        // Create the new bucket
        await storage.createBucket(bucketName);

        // Delete the old bucket
        await storage.bucket(website.bucketName).delete();

        website.bucketName = bucketName;
      } catch (error) {
        console.error("Error updating bucket:", error);
        return res
          .status(500)
          .json({ message: "Error updating bucket", error: error.message });
      }
    }

    // Update website details in MongoDB
    Object.assign(website, req.body);
    await website.save();

    res.status(200).json(website);
  } catch (error) {
    console.error("Error updating website:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a website and its bucket by ID
router.delete("/:id", async (req, res) => {
  try {
    const website = await Website.findByIdAndDelete(req.params.id);
    if (!website) return res.status(404).json({ message: "Website not found" });

    // Delete bucket in GCP
    await storage.bucket(website.bucketName).delete();

    res.status(200).json({ message: "Website and bucket deleted" });
  } catch (error) {
    console.error("Error deleting website and bucket:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
