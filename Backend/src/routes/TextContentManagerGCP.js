const express = require("express");
const { Storage } = require("@google-cloud/storage");
const Page = require("../models/Page");
const authMiddleware = require("../middleware/authMiddleware");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

const router = express.Router();
const storage = new Storage({ keyFilename: process.env.GCS_KEY_FILE || "./key.json" });
const folderName = "website_text_content";

// Fetch page list for a bucket
router.get("/folders/:bucketName", authMiddleware(["super admin", "admin", "editor"]), async (req, res, next) => {
  const { bucketName } = req.params;
  const bucket = storage.bucket(bucketName);

  try {
    const options = {
      prefix: `${folderName}/`,
      delimiter: "./"
    };

    const [files] = await bucket.getFiles(options);
    const pages = {};

    files.forEach(file => {
      const pathComponents = file.name.split("/");
      if (pathComponents.length > 2) {
        const pageId = pathComponents[1];
        pages[pageId] = true;
      }
    });

    res.status(200).json({ success: true, data: Object.keys(pages) });
  } catch (error) {
    next(error);
  }
});

// Update page content
router.post("/content/:bucketName/:pageId", authMiddleware(["super admin", "admin"]), async (req, res, next) => {
  const { bucketName, pageId } = req.params;
  const newContent = req.body;
  const bucket = storage.bucket(bucketName);

  try {
    let pageMetadata = await Page.findOne({ page_id: pageId });

    if (!pageMetadata) {
      const file_path = `${folderName}/${pageId}/${pageId}.json`;
      pageMetadata = new Page({ page_id: pageId, file_path });
      await pageMetadata.save();
    }

    const file = bucket.file(pageMetadata.file_path);
    const content = JSON.stringify(newContent);
    await file.save(content);

    pageMetadata.last_updated = Date.now();
    await pageMetadata.save();

    res.status(200).json({ success: true, data: { message: "Content updated successfully" } });
  } catch (error) {
    next(error);
  }
});

// Get page content
router.get("/content/:bucketName/:pageId", authMiddleware(["super admin", "admin", "editor"]), async (req, res, next) => {
  const { bucketName, pageId } = req.params;
  const bucket = storage.bucket(bucketName);

  try {
    const pageMetadata = await Page.findOne({ page_id: pageId });
    if (!pageMetadata) {
      throw new AppError("Page metadata not found", 404);
    }

    const file = bucket.file(pageMetadata.file_path);
    const [content] = await file.download();

    res.status(200).json({ success: true, data: JSON.parse(content.toString()) });
  } catch (error) {
    next(error);
  }
});

// Create a new page
router.post("/folders/:bucketName", authMiddleware(["super admin", "admin"]), async (req, res, next) => {
  const { bucketName } = req.params;
  const { pageId, initialContent } = req.body;
  const bucket = storage.bucket(bucketName);

  try {
    if (!pageId) {
      throw new AppError("pageId is required", 400);
    }

    const file_path = `${folderName}/${pageId}/${pageId}.json`;
    const pageMetadata = new Page({ page_id: pageId, file_path });
    await pageMetadata.save();

    const file = bucket.file(file_path);
    const content = JSON.stringify(initialContent || {});
    await file.save(content);

    res.status(201).json({ success: true, data: { message: "Page created successfully" } });
  } catch (error) {
    next(error);
  }
});

// Delete a page
router.delete("/content/:bucketName/:pageId", authMiddleware(["super admin", "admin"]), async (req, res, next) => {
  const { bucketName, pageId } = req.params;
  const bucket = storage.bucket(bucketName);

  try {
    const pageMetadata = await Page.findOne({ page_id: pageId });
    if (!pageMetadata) {
      throw new AppError("Page metadata not found", 404);
    }

    const file = bucket.file(pageMetadata.file_path);
    await file.delete();
    await Page.deleteOne({ page_id: pageId });

    res.status(200).json({ success: true, data: { message: "Page deleted successfully" } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
