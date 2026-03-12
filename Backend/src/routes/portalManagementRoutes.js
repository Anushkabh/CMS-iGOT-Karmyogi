const express = require("express");
const Portal = require("../models/Portal");
const Banner = require("../models/Banner");
const NudgeMessage = require("../models/NudgeMessage");
const authMiddleware = require("../middleware/authMiddleware");
const { portalValidation, bannerValidation, nudgeValidation, mongoIdParam } = require("../middleware/validators");
const { AppError } = require("../middleware/errorHandler");

const router = express.Router();

// ==================== PORTAL CRUD ====================

// Create a new portal
router.post(
  "/",
  authMiddleware(["super admin", "admin"]),
  portalValidation,
  async (req, res, next) => {
    try {
      const { name, portalId, description, websiteId } = req.body;

      const existing = await Portal.findOne({ portalId });
      if (existing) {
        throw new AppError("Portal with this ID already exists", 409);
      }

      const portal = new Portal({ name, portalId, description, websiteId });
      await portal.save();

      res.status(201).json({ success: true, data: portal });
    } catch (error) {
      next(error);
    }
  }
);

// Get all portals
router.get(
  "/",
  authMiddleware(["super admin", "admin", "editor"]),
  async (req, res, next) => {
    try {
      const portals = await Portal.find().populate("websiteId", "name url");
      res.status(200).json({ success: true, data: portals });
    } catch (error) {
      next(error);
    }
  }
);

// Get portal by ID
router.get(
  "/:id",
  authMiddleware(["super admin", "admin", "editor"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const portal = await Portal.findById(req.params.id).populate("websiteId", "name url");
      if (!portal) throw new AppError("Portal not found", 404);
      res.status(200).json({ success: true, data: portal });
    } catch (error) {
      next(error);
    }
  }
);

// Update portal
router.put(
  "/:id",
  authMiddleware(["super admin", "admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const portal = await Portal.findById(req.params.id);
      if (!portal) throw new AppError("Portal not found", 404);

      const { name, description, isActive, websiteId } = req.body;
      if (name) portal.name = name;
      if (description !== undefined) portal.description = description;
      if (isActive !== undefined) portal.isActive = isActive;
      if (websiteId) portal.websiteId = websiteId;

      await portal.save();
      res.status(200).json({ success: true, data: portal });
    } catch (error) {
      next(error);
    }
  }
);

// Delete portal
router.delete(
  "/:id",
  authMiddleware(["super admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const portal = await Portal.findByIdAndDelete(req.params.id);
      if (!portal) throw new AppError("Portal not found", 404);

      // Clean up associated banners and nudges
      await Banner.deleteMany({ portalId: portal.portalId });
      await NudgeMessage.deleteMany({ portalId: portal.portalId });

      res.status(200).json({ success: true, data: { message: "Portal and associated content deleted" } });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== BANNER CRUD ====================

// Create banner
router.post(
  "/banners",
  authMiddleware(["super admin", "admin"]),
  bannerValidation,
  async (req, res, next) => {
    try {
      const { title, imageUrl, linkUrl, portalId, displayOrder, startDate, endDate } = req.body;

      // Verify portal exists
      const portal = await Portal.findOne({ portalId });
      if (!portal) throw new AppError("Portal not found", 404);

      const banner = new Banner({
        title,
        imageUrl,
        linkUrl,
        portalId,
        displayOrder,
        startDate,
        endDate,
        createdBy: req.user._id,
      });
      await banner.save();

      res.status(201).json({ success: true, data: banner });
    } catch (error) {
      next(error);
    }
  }
);

// Get all banners (with optional portalId filter)
router.get(
  "/banners",
  authMiddleware(["super admin", "admin", "editor"]),
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.portalId) filter.portalId = req.query.portalId;

      const banners = await Banner.find(filter)
        .sort({ displayOrder: 1 })
        .populate("createdBy", "name email");

      res.status(200).json({ success: true, data: banners });
    } catch (error) {
      next(error);
    }
  }
);

// Update banner
router.put(
  "/banners/:id",
  authMiddleware(["super admin", "admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) throw new AppError("Banner not found", 404);

      const { title, imageUrl, linkUrl, displayOrder, isActive, startDate, endDate } = req.body;
      if (title) banner.title = title;
      if (imageUrl) banner.imageUrl = imageUrl;
      if (linkUrl !== undefined) banner.linkUrl = linkUrl;
      if (displayOrder !== undefined) banner.displayOrder = displayOrder;
      if (isActive !== undefined) banner.isActive = isActive;
      if (startDate !== undefined) banner.startDate = startDate;
      if (endDate !== undefined) banner.endDate = endDate;

      await banner.save();
      res.status(200).json({ success: true, data: banner });
    } catch (error) {
      next(error);
    }
  }
);

// Delete banner
router.delete(
  "/banners/:id",
  authMiddleware(["super admin", "admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const banner = await Banner.findByIdAndDelete(req.params.id);
      if (!banner) throw new AppError("Banner not found", 404);
      res.status(200).json({ success: true, data: { message: "Banner deleted" } });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== NUDGE MESSAGE CRUD ====================

// Create nudge message
router.post(
  "/nudges",
  authMiddleware(["super admin", "admin"]),
  nudgeValidation,
  async (req, res, next) => {
    try {
      const { title, body, portalId, type, targetAudience, startDate, endDate } = req.body;

      const portal = await Portal.findOne({ portalId });
      if (!portal) throw new AppError("Portal not found", 404);

      const nudge = new NudgeMessage({
        title,
        body,
        portalId,
        type,
        targetAudience,
        startDate,
        endDate,
        createdBy: req.user._id,
      });
      await nudge.save();

      res.status(201).json({ success: true, data: nudge });
    } catch (error) {
      next(error);
    }
  }
);

// Get all nudge messages (with optional portalId filter)
router.get(
  "/nudges",
  authMiddleware(["super admin", "admin", "editor"]),
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.portalId) filter.portalId = req.query.portalId;

      const nudges = await NudgeMessage.find(filter)
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email");

      res.status(200).json({ success: true, data: nudges });
    } catch (error) {
      next(error);
    }
  }
);

// Update nudge message
router.put(
  "/nudges/:id",
  authMiddleware(["super admin", "admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const nudge = await NudgeMessage.findById(req.params.id);
      if (!nudge) throw new AppError("Nudge message not found", 404);

      const { title, body, type, targetAudience, isActive, startDate, endDate } = req.body;
      if (title) nudge.title = title;
      if (body) nudge.body = body;
      if (type) nudge.type = type;
      if (targetAudience !== undefined) nudge.targetAudience = targetAudience;
      if (isActive !== undefined) nudge.isActive = isActive;
      if (startDate !== undefined) nudge.startDate = startDate;
      if (endDate !== undefined) nudge.endDate = endDate;

      await nudge.save();
      res.status(200).json({ success: true, data: nudge });
    } catch (error) {
      next(error);
    }
  }
);

// Delete nudge message
router.delete(
  "/nudges/:id",
  authMiddleware(["super admin", "admin"]),
  mongoIdParam,
  async (req, res, next) => {
    try {
      const nudge = await NudgeMessage.findByIdAndDelete(req.params.id);
      if (!nudge) throw new AppError("Nudge message not found", 404);
      res.status(200).json({ success: true, data: { message: "Nudge message deleted" } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
