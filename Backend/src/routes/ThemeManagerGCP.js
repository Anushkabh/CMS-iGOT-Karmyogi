const express = require("express");
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const router = express.Router();
const Theme = require('../models/Theme');

const storage = new Storage({ keyFilename: "./key.json" });
const mediaFolderName = "theme_manager_Store"; // The main folder for Theme Manager

const upload = multer({ storage: multer.memoryStorage() });

// Route to create a subfolder within media_content
router.post("/media/folders/:bucketName", async (req, res) => {
  const { bucketName } = req.params;
  const { folderName } = req.body;
  const bucket = storage.bucket(bucketName);
  const folderPath = `${mediaFolderName}/${folderName}/`;

  try {
    // Check if the folder already exists
    const [existingFiles] = await bucket.getFiles({
      prefix: folderPath,
      delimiter: "/",
    });
    if (existingFiles.length > 0) {
      return res.status(400).send("Folder already exists");
    }

    // Create an empty placeholder
    const file = bucket.file(`${folderPath}`);
    await file.save("", { resumable: false });
    res.status(200).send("Folder created successfully");
  } catch (err) {
    console.error("Error creating subfolder:", err);
    res.status(500).send(`Internal server error: ${err.message}`);
  }
});

// Route to set the theme by copying contents from a folder to 'current_theme'
router.post("/setTheme/:bucketName/:sourceFolderName", async (req, res) => {
  const { bucketName, sourceFolderName  } = req.params;
  const bucket = storage.bucket(bucketName);
  const currentThemePath = `${mediaFolderName}/current_theme/`;
  const sourceFolderPath = `${mediaFolderName}/${sourceFolderName}/`;

  try {
    // Step 1: Checking if 'current_theme' exists
    const [currentThemeFiles] = await bucket.getFiles({ prefix: currentThemePath });

    if (currentThemeFiles.length > 0) {
      // Step 2: Deleting all files in 'current_theme'
      const deletePromises = currentThemeFiles.map(file => file.delete());
      await Promise.all(deletePromises);
    }

    // Step 3: Get all files from the source folder
    const [sourceFiles] = await bucket.getFiles({ prefix: sourceFolderPath });

    // Step 4: Copy each file from the source folder to 'current_theme'
    const copyPromises = sourceFiles.map(sourceFile => {
      const destination = bucket.file(currentThemePath + sourceFile.name.split('/').pop());
      return sourceFile.copy(destination);
    });

    await Promise.all(copyPromises);

    const theme = await Theme.findOne({ website: bucketName });


    if (theme) {
      // If theme entry exists, update currentTheme and push to history
      theme.history.push({
        theme: theme.currentTheme,
        dateSet: new Date()
      });
      theme.currentTheme = sourceFolderName;
      await theme.save();
    } else {
      // If no entry exists, create a new one
      const newTheme = new Theme({
        website: bucketName,
        currentTheme: sourceFolderName,
        history: [{ theme: sourceFolderName, dateSet: new Date() }]
      });
      await newTheme.save();
    }



    res.status(200).send("Theme set successfully by copying files to 'current_theme'.");
  } catch (err) {
    console.error("Error setting theme:", err);
    res.status(500).send(`Internal server error: ${err.message}`);
  }
});

// Route to fetch theme details for a specific website (bucketName)
router.get("/getThemeDetails/:bucketName", async (req, res) => {
  const { bucketName } = req.params;

  try {
    // Find the theme details for the specified website (bucketName)
    const themeDetails = await Theme.findOne({ website: bucketName });

    if (!themeDetails) {
      // If no theme details found, send a 404 response
      return res.status(404).send(`No theme details found for website: ${bucketName}`);
    }

    // If theme details found, send them back in the response
    res.status(200).json(themeDetails);
  } catch (err) {
    console.error("Error fetching theme details:", err);
    res.status(500).send(`Internal server error: ${err.message}`);
  }
});


// Route to delete a subfolder within media_content
router.delete("/media/folders/:bucketName/:folderName", async (req, res) => {
  const { bucketName, folderName } = req.params;
  const bucket = storage.bucket(bucketName);
  const folderPath = `${mediaFolderName}/${folderName}/`;

  try {
    // Check if the folder exists by listing files with the given prefix
    const [files] = await bucket.getFiles({ prefix: folderPath });

    if (files.length === 0) {
      return res.status(404).send("Folder not found");
    }

    // Delete all files within the folder
    const deletePromises = files.map((file) => file.delete());
    await Promise.all(deletePromises);

    res.status(200).send("Folder deleted successfully");
  } catch (err) {
    console.error("Error deleting subfolder:", err);
    if (err.code === 404) {
      res.status(404).send("Folder not found");
    } else {
      res.status(500).send(`Internal server error: ${err.message}`);
    }
  }
});

// Route to upload media content to a specified subfolder
router.post(
  "/media/upload/:bucketName/:folderName",
  upload.single("file"),
  async (req, res) => {
    const { bucketName, folderName } = req.params;
    const bucket = storage.bucket(bucketName);
    const folderPath = `${mediaFolderName}/${folderName}/`;

    const file = req.file; // This is set by multer
    const filePath = `${folderPath}${file.originalname}`;

    try {
      const gcsFile = bucket.file(filePath);
      await gcsFile.save(file.buffer, {
        contentType: file.mimetype,
      });
      res.status(200).send("Media content uploaded successfully");
    } catch (err) {
      console.error("Error uploading media content:", err);
      res.status(500).send(`Internal server error: ${err.message}`);
    }
  }
);

// Route to delete media content from a specified subfolder
router.delete(
  "/media/delete/:bucketName/:folderName/:fileName",
  async (req, res) => {
    const { bucketName, folderName, fileName } = req.params;
    const bucket = storage.bucket(bucketName);
    const filePath = `${mediaFolderName}/${folderName}/${fileName}`;

    try {
      const file = bucket.file(filePath);

      // Check if the file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).send("File not found");
      }

      // Delete the file
      await file.delete();
      res.status(200).send("File deleted successfully");
    } catch (err) {
      console.error("Error deleting file:", err);
      res.status(500).send(`Internal server error: ${err.message}`);
    }
  }
);

// Route to fetch everything in media_content folder
router.get("/media/:bucketName", async (req, res) => {
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

    res.status(200).json(fileDetails);
  } catch (err) {
    console.error("Error fetching media content:", err);
    res.status(500).send(`Internal server error: ${err.message}`);
  }
});

// Route to fetch all files and folders at a specified location
router.get("/media/list/:bucketName", async (req, res) => {
  const { bucketName } = req.params;
  const { location } = req.query; // Use query parameter to specify location
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

    res.status(200).json(fileDetails);
  } catch (err) {
    console.error("Error fetching files and folders:", err);
    res.status(500).send(`Internal server error: ${err.message}`);
  }
});

// Route to fetch folder names and subfolders/files for a specific folder
router.get("/currfolders/:bucketName", async (req, res) => {
  const { bucketName } = req.params;
  const bucket = storage.bucket(bucketName);

  try {
    const options = {
      prefix: `${mediaFolderName}/`,
      delimiter: "./",
    };

    // List files and subdirectories in the specified folder
    const [files] = await bucket.getFiles(options);

    const pages = {};

    files.forEach((file) => {
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

router.get("/currfolders/:bucketName/:folderName", async (req, res) => {
  const { bucketName, folderName } = req.params;
  const bucket = storage.bucket(bucketName);
  const folderPath = `${mediaFolderName}/${folderName}/`;

  try {
    const options = {
      prefix: folderPath,
      delimiter: "/",
    };

    // List files and subdirectories in the specified folder
    const [files, directories] = await bucket.getFiles(options);

    // Debugging output
    console.log("Files:", files);
    console.log("Directories:", directories);

    const result = {
      files: [],
      folders: [],
    };

    // Ensure files and directories are properly defined
    if (files && Array.isArray(files)) {
      for (const file of files) {
        const fileName = file.name.replace(folderPath, "");
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;

        // Fetch file metadata
        const [metadata] = await file.getMetadata();

        result.files.push({
          name: fileName,
          url: publicUrl,
          size: metadata.size,
          contentType: metadata.contentType,
          updated: metadata.updated,
        });
      }
    } else {
      console.warn("Files are not defined or not an array.");
    }

    if (directories && Array.isArray(directories.prefixes)) {
      directories.prefixes.forEach((folder) => {
        const folderName = folder.replace(folderPath, "").replace("/", "");
        if (folderName) {
          result.folders.push(folderName);
        }
      });
    } else {
      console.warn(
        "Directories or directories.prefixes are not defined or not an array."
      );
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching folders and files:", err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
