const express = require("express");
const { Storage } = require("@google-cloud/storage");
const Page = require("../models/Page");
const router = express.Router();

const storage = new Storage({ keyFilename: "./key.json" });
const folderName = "website_text_content"; // Replace with your folder name in GCS

// Route to fetch folder names and subfolders/files for a specific folder
router.get("/folders/:bucketName", async (req, res) => {
  const { bucketName } = req.params;
  const bucket = storage.bucket(bucketName);
  
  try {
    const options = {
      prefix: `${folderName}/`,
      delimiter: "./"
    };

    // List files and subdirectories in the specified folder
    const [files] = await bucket.getFiles(options);

    const pages = {};

    files.forEach(file => {
      // Extract page names from file paths
      const pathComponents = file.name.split("/");
      if (pathComponents.length > 2) {
        const pageId = pathComponents[1]; // Assuming page ID is the third component
        pages[pageId] = true; // Use object to ensure unique page IDs
      }
    });

    res.status(200).json(Object.keys(pages));
  } catch (err) {
    console.error("Error fetching pages:", err);
    res.status(500).send("Internal server error");
  }
});

router.post("/content/:bucketName/:pageId", async (req, res) => {
  const { bucketName, pageId } = req.params;
  const newContent = req.body;
  const bucket = storage.bucket(bucketName);

  try {
    // Find page metadata in MongoDB
    let pageMetadata = await Page.findOne({ page_id: pageId });

    // If page metadata doesn't exist, create new metadata entry
    if (!pageMetadata) {
      const file_path = `${folderName}/${pageId}/${pageId}.json`; // GCS file path
      pageMetadata = new Page({ page_id: pageId, file_path: file_path });
      await pageMetadata.save();
    }

    // Get file reference in GCS
    const file = bucket.file(pageMetadata.file_path);

    // Prepare content to upload (replace existing content)
    const content = JSON.stringify(newContent);

    // Upload content to GCS
    await file.save(content);

    // Update last_updated timestamp in MongoDB
    pageMetadata.last_updated = Date.now();
    await pageMetadata.save();

    res.status(200).send("Content updated successfully");
  } catch (err) {
    console.error("Error updating content:", err);
    res.status(500).send("Internal server error");
  }
});

router.get("/content/:bucketName/:pageId", async (req, res) => {
  const { bucketName, pageId } = req.params;
  const bucket = storage.bucket(bucketName);

  try {
    // Find page metadata in MongoDB
    const pageMetadata = await Page.findOne({ page_id: pageId });

    if (!pageMetadata) {
      return res.status(404).send("Page metadata not found");
    }

    // Get file reference in GCS
    const file = bucket.file(pageMetadata.file_path);

    // Download content from GCS
    const [content] = await file.download();

    res.status(200).json(JSON.parse(content.toString()));
  } catch (err) {
    console.error("Error fetching content:", err);
    res.status(500).send("Internal server error");
  }
});

router.post("/folders/:bucketName", async (req, res) => {
  const { bucketName } = req.params;
  const { pageId, initialContent } = req.body;
  const bucket = storage.bucket(bucketName);

  try {
    const file_path = `${folderName}/${pageId}/${pageId}.json`;
    const pageMetadata = new Page({ page_id: pageId, file_path: file_path });
    await pageMetadata.save();

    const file = bucket.file(file_path);
    const content = JSON.stringify(initialContent);
    await file.save(content);

    res.status(200).send("Folder and page created successfully");
  } catch (err) {
    console.error("Error creating folder/page:", err);
    res.status(500).send("Internal server error");
  }
});

// Route to delete a page
router.delete("/content/:bucketName/:pageId", async (req, res) => {
  const { bucketName, pageId } = req.params;
  const bucket = storage.bucket(bucketName);

  try {
    // Find page metadata in MongoDB
    const pageMetadata = await Page.findOne({ page_id: pageId });

    if (!pageMetadata) {
      return res.status(404).send("Page metadata not found");
    }

    // Get file reference in GCS
    const file = bucket.file(pageMetadata.file_path);

    // Delete the file in GCS
    await file.delete();

    // Remove the page metadata from MongoDB
    await Page.deleteOne({ page_id: pageId });

    res.status(200).send("Page deleted successfully");
  } catch (err) {
    console.error("Error deleting page:", err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
