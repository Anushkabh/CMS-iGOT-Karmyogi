const express = require("express");
const { Storage } = require("@google-cloud/storage");
const Theme = require("../models/Theme");
const authMiddleware = require("../middleware/authMiddleware");
const { AppError } = require("../middleware/errorHandler");
const upload = require("../middleware/uploadConfig");
const logger = require("../utils/logger");

const router = express.Router();
const storage = new Storage({ keyFilename: process.env.GCS_KEY_FILE || "./key.json" });
const mediaFolderName = "theme_manager_Store";

// Create a subfolder for themes
router.post("/media/folders/:bucketName", authMiddleware(["super admin", "admin"]), async (req, res, next) => {
  const { bucketName } = req.params;
  const { folderName } = req.body;
  const bucket = storage.bucket(bucketName);
  const folderPath = `${mediaFolderName}/${folderName}/`;

  try {
    if (!folderName) {
      throw new AppError("folderName is required", 400);
    }

    const [existingFiles] = await bucket.getFiles({
      prefix: folderPath,
      delimiter: "/",
    });
    if (existingFiles.length > 0) {
      throw new AppError("Folder already exists", 409);
    }

    const file = bucket.file(folderPath);
    await file.save("", { resumable: false });
    res.status(201).json({ success: true, data: { message: "Theme folder created successfully" } });
  } catch (error) {
    next(error);
  }
});

// Set the theme by copying contents from a folder to 'current_theme'
router.post("/setTheme/:bucketName/:sourceFolderName", authMiddleware(["super admin", "admin"]), async (req, res, next) => {
  const { bucketName, sourceFolderName } = req.params;
  const bucket = storage.bucket(bucketName);
  const currentThemePath = `${mediaFolderName}/current_theme/`;
  const sourceFolderPath = `${mediaFolderName}/${sourceFolderName}/`;

  try {
    // Clear current theme
    const [currentThemeFiles] = await bucket.getFiles({ prefix: currentThemePath });
    if (currentThemeFiles.length > 0) {
      const deletePromises = currentThemeFiles.map(file => file.delete());
      await Promise.all(deletePromises);
    }

    // Copy source folder to current_theme
    const [sourceFiles] = await bucket.getFiles({ prefix: sourceFolderPath });
    if (sourceFiles.length === 0) {
      throw new AppError("Source theme folder is empty or not found", 404);
    }

    const copyPromises = sourceFiles.map(sourceFile => {
      const destination = bucket.file(currentThemePath + sourceFile.name.split("/").pop());
      return sourceFile.copy(destination);
    });
    await Promise.all(copyPromises);

    // Update theme record in MongoDB
    const theme = await Theme.findOne({ website: bucketName });
    if (theme) {
      theme.history.push({
        theme: theme.currentTheme,
        dateSet: new Date(),
      });
      theme.currentTheme = sourceFolderName;
      await theme.save();
    } else {
      const newTheme = new Theme({
        website: bucketName,
        currentTheme: sourceFolderName,
        history: [{ theme: sourceFolderName, dateSet: new Date() }],
      });
      await newTheme.save();
    }

    res.status(200).json({ success: true, data: { message: "Theme set successfully" } });
  } catch (error) {
    next(error);
  }
});

// Fetch theme details for a website
router.get("/getThemeDetails/:bucketName", authMiddleware(["super admin", "admin", "editor"]), async (req, res, next) => {
  const { bucketName } = req.params;

  try {
    const themeDetails = await Theme.findOne({ website: bucketName });
    if (!themeDetails) {
      throw new AppError(`No theme details found for website: ${bucketName}`, 404);
    }

    res.status(200).json({ success: true, data: themeDetails });
  } catch (error) {
    next(error);
  }
});

// Delete a subfolder
router.delete("/media/folders/:bucketName/:folderName", authMiddleware(["super admin", "admin"]), async (req, res, next) => {
  const { bucketName, folderName } = req.params;
  const bucket = storage.bucket(bucketName);
  const folderPath = `${mediaFolderName}/${folderName}/`;

  try {
    const [files] = await bucket.getFiles({ prefix: folderPath });
    if (files.length === 0) {
      throw new AppError("Folder not found", 404);
    }

    const deletePromises = files.map((file) => file.delete());
    await Promise.all(deletePromises);

    res.status(200).json({ success: true, data: { message: "Folder deleted successfully" } });
  } catch (error) {
    next(error);
  }
});

// Upload theme file to a specified subfolder
router.post(
  "/media/upload/:bucketName/:folderName",
  authMiddleware(["super admin", "admin"]),
  upload.single("file"),
  async (req, res, next) => {
    const { bucketName, folderName } = req.params;
    const bucket = storage.bucket(bucketName);
    const folderPath = `${mediaFolderName}/${folderName}/`;

    try {
      if (!req.file) {
        throw new AppError("No file provided", 400);
      }

      const file = req.file;
      const filePath = `${folderPath}${file.originalname}`;

      const gcsFile = bucket.file(filePath);
      await gcsFile.save(file.buffer, {
        contentType: file.mimetype,
      });

      res.status(200).json({ success: true, data: { message: "Theme file uploaded successfully" } });
    } catch (error) {
      next(error);
    }
  }
);

// Delete theme file
router.delete(
  "/media/delete/:bucketName/:folderName/:fileName",
  authMiddleware(["super admin", "admin"]),
  async (req, res, next) => {
    const { bucketName, folderName, fileName } = req.params;
    const bucket = storage.bucket(bucketName);
    const filePath = `${mediaFolderName}/${folderName}/${fileName}`;

    try {
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) {
        throw new AppError("File not found", 404);
      }

      await file.delete();
      res.status(200).json({ success: true, data: { message: "File deleted successfully" } });
    } catch (error) {
      next(error);
    }
  }
);

// Fetch everything in theme folder
router.get("/media/:bucketName", authMiddleware(["super admin", "admin", "editor"]), async (req, res, next) => {
  const { bucketName } = req.params;
  const bucket = storage.bucket(bucketName);
  const mediaFolder = `${mediaFolderName}/`;

  try {
    const [files] = await bucket.getFiles({ prefix: mediaFolder });

    const fileDetails = files.map((file) => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      updated: file.metadata.updated,
    }));

    res.status(200).json({ success: true, data: fileDetails });
  } catch (error) {
    next(error);
  }
});

// Fetch files and folders at a specified location
router.get("/media/list/:bucketName", authMiddleware(["super admin", "admin", "editor"]), async (req, res, next) => {
  const { bucketName } = req.params;
  const { location } = req.query;
  const bucket = storage.bucket(bucketName);
  const folderPath = location ? `${location}/` : `${mediaFolderName}/`;

  try {
    const [files] = await bucket.getFiles({
      prefix: folderPath,
      delimiter: "/",
    });

    const fileDetails = files.map((file) => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      updated: file.metadata.updated,
    }));

    res.status(200).json({ success: true, data: fileDetails });
  } catch (error) {
    next(error);
  }
});

// Fetch theme folder names
router.get("/currfolders/:bucketName", authMiddleware(["super admin", "admin", "editor"]), async (req, res, next) => {
  const { bucketName } = req.params;
  const bucket = storage.bucket(bucketName);

  try {
    const options = {
      prefix: `${mediaFolderName}/`,
      delimiter: "./",
    };

    const [files] = await bucket.getFiles(options);
    const pages = {};

    files.forEach((file) => {
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

// Fetch theme folder contents
router.get("/currfolders/:bucketName/:folderName", authMiddleware(["super admin", "admin", "editor"]), async (req, res, next) => {
  const { bucketName, folderName } = req.params;
  const bucket = storage.bucket(bucketName);
  const folderPath = `${mediaFolderName}/${folderName}/`;

  try {
    const options = {
      prefix: folderPath,
      delimiter: "/",
    };

    const [files, directories] = await bucket.getFiles(options);

    const result = {
      files: [],
      folders: [],
    };

    if (files && Array.isArray(files)) {
      for (const file of files) {
        const fileName = file.name.replace(folderPath, "");
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
        const [metadata] = await file.getMetadata();

        result.files.push({
          name: fileName,
          url: publicUrl,
          size: metadata.size,
          contentType: metadata.contentType,
          updated: metadata.updated,
        });
      }
    }

    if (directories && Array.isArray(directories.prefixes)) {
      directories.prefixes.forEach((folder) => {
        const name = folder.replace(folderPath, "").replace("/", "");
        if (name) {
          result.folders.push(name);
        }
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
