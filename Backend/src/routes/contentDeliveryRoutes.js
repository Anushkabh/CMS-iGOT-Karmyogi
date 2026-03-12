const express = require("express");
const Portal = require("../models/Portal");
const Banner = require("../models/Banner");
const NudgeMessage = require("../models/NudgeMessage");
const Theme = require("../models/Theme");
const Page = require("../models/Page");
const { Storage } = require("@google-cloud/storage");
const { AppError } = require("../middleware/errorHandler");

const router = express.Router();
const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE || "./key.json",
});

// Helper: build a date filter for active content with optional scheduling
const activeContentFilter = (portalId) => {
  const now = new Date();
  return {
    portalId,
    isActive: true,
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $gte: now } },
    ],
  };
};

// GET /api/v1/portals - list all active portals
router.get("/portals", async (req, res, next) => {
  try {
    const portals = await Portal.find({ isActive: true }).select("name portalId description");
    res.set("Cache-Control", "public, max-age=300");
    res.status(200).json({ success: true, data: portals });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/portals/:portalId/banners - active banners for a portal
router.get("/portals/:portalId/banners", async (req, res, next) => {
  try {
    const { portalId } = req.params;

    const portal = await Portal.findOne({ portalId, isActive: true });
    if (!portal) throw new AppError("Portal not found", 404);

    const banners = await Banner.find(activeContentFilter(portalId))
      .sort({ displayOrder: 1 })
      .select("title imageUrl linkUrl displayOrder");

    res.set("Cache-Control", "public, max-age=60");
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/portals/:portalId/nudges - active nudge messages for a portal
router.get("/portals/:portalId/nudges", async (req, res, next) => {
  try {
    const { portalId } = req.params;

    const portal = await Portal.findOne({ portalId, isActive: true });
    if (!portal) throw new AppError("Portal not found", 404);

    const nudges = await NudgeMessage.find(activeContentFilter(portalId))
      .sort({ createdAt: -1 })
      .select("title body type targetAudience");

    res.set("Cache-Control", "public, max-age=60");
    res.status(200).json({ success: true, data: nudges });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/portals/:portalId/theme - current theme for portal's website
router.get("/portals/:portalId/theme", async (req, res, next) => {
  try {
    const { portalId } = req.params;

    const portal = await Portal.findOne({ portalId, isActive: true }).populate("websiteId");
    if (!portal) throw new AppError("Portal not found", 404);
    if (!portal.websiteId) throw new AppError("No website linked to this portal", 404);

    const theme = await Theme.findOne({ website: portal.websiteId.bucketName });
    if (!theme) throw new AppError("No theme configured for this portal", 404);

    const bucket = storage.bucket(portal.websiteId.bucketName);
    const themeFolder = `theme_manager_Store/current_theme/`;
    const [files] = await bucket.getFiles({ prefix: themeFolder });

    const themeFiles = files.map((file) => ({
      name: file.name.replace(themeFolder, ""),
      url: `https://storage.googleapis.com/${portal.websiteId.bucketName}/${file.name}`,
      contentType: file.metadata.contentType,
    }));

    res.set("Cache-Control", "public, max-age=300");
    res.status(200).json({
      success: true,
      data: {
        currentTheme: theme.currentTheme,
        files: themeFiles,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/portals/:portalId/pages/:pageId - page content for a portal
router.get("/portals/:portalId/pages/:pageId", async (req, res, next) => {
  try {
    const { portalId, pageId } = req.params;

    const portal = await Portal.findOne({ portalId, isActive: true }).populate("websiteId");
    if (!portal) throw new AppError("Portal not found", 404);
    if (!portal.websiteId) throw new AppError("No website linked to this portal", 404);

    const pageMetadata = await Page.findOne({ page_id: pageId });
    if (!pageMetadata) throw new AppError("Page not found", 404);

    const bucket = storage.bucket(portal.websiteId.bucketName);
    const file = bucket.file(pageMetadata.file_path);
    const [content] = await file.download();

    res.set("Cache-Control", "public, max-age=60");
    res.status(200).json({ success: true, data: JSON.parse(content.toString()) });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/portals/:portalId/media - list media for a portal
router.get("/portals/:portalId/media", async (req, res, next) => {
  try {
    const { portalId } = req.params;

    const portal = await Portal.findOne({ portalId, isActive: true }).populate("websiteId");
    if (!portal) throw new AppError("Portal not found", 404);
    if (!portal.websiteId) throw new AppError("No website linked to this portal", 404);

    const bucket = storage.bucket(portal.websiteId.bucketName);
    const [files] = await bucket.getFiles({ prefix: "media_content/" });

    const mediaFiles = files
      .filter((f) => !f.name.endsWith("/"))
      .map((file) => ({
        name: file.name.replace("media_content/", ""),
        url: `https://storage.googleapis.com/${portal.websiteId.bucketName}/${file.name}`,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        updated: file.metadata.updated,
      }));

    res.set("Cache-Control", "public, max-age=300");
    res.status(200).json({ success: true, data: mediaFiles });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
