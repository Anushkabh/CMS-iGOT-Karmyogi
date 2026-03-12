const { body, param, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const addSuperAdminValidation = [
  body("name").trim().notEmpty().isLength({ max: 100 }).withMessage("Name is required (max 100 chars)"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("phone").matches(/^[0-9]{10}$/).withMessage("Phone must be 10 digits"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  validate,
];

const addUserValidation = [
  body("name").trim().notEmpty().isLength({ max: 100 }).withMessage("Name is required (max 100 chars)"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("phone").matches(/^[0-9]{10}$/).withMessage("Phone must be 10 digits"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role").isIn(["admin", "editor"]).withMessage("Role must be admin or editor"),
  validate,
];

const changePasswordValidation = [
  body("userID").isMongoId().withMessage("Valid user ID is required"),
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
  validate,
];

const updateUserDetailValidation = [
  param("id").isMongoId().withMessage("Valid user ID is required"),
  body("name").optional().trim().isLength({ max: 100 }),
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().matches(/^[0-9]{10}$/),
  validate,
];

const mongoIdParam = [
  param("id").isMongoId().withMessage("Valid ID is required"),
  validate,
];

const websiteValidation = [
  body("name").trim().notEmpty().withMessage("Website name is required"),
  body("url").isURL().withMessage("Valid URL is required"),
  body("bucketName")
    .matches(/^[a-z0-9][-a-z0-9.]{1,61}[a-z0-9]$/)
    .withMessage("Invalid GCS bucket name format"),
  validate,
];

const bucketNameParam = [
  param("bucketName")
    .matches(/^[a-z0-9][-a-z0-9.]{1,61}[a-z0-9]$/)
    .withMessage("Invalid bucket name"),
  validate,
];

const portalValidation = [
  body("name").trim().notEmpty().withMessage("Portal name is required"),
  body("portalId").trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage("Portal ID must be lowercase alphanumeric with hyphens"),
  body("description").optional().trim(),
  validate,
];

const bannerValidation = [
  body("title").trim().notEmpty().withMessage("Banner title is required"),
  body("imageUrl").isURL().withMessage("Valid image URL is required"),
  body("linkUrl").optional().isURL().withMessage("Link URL must be valid"),
  body("portalId").trim().notEmpty().withMessage("Portal ID is required"),
  body("displayOrder").optional().isInt({ min: 0 }),
  body("startDate").optional().isISO8601(),
  body("endDate").optional().isISO8601(),
  validate,
];

const nudgeValidation = [
  body("title").trim().notEmpty().withMessage("Nudge title is required"),
  body("body").trim().notEmpty().withMessage("Nudge body is required"),
  body("portalId").trim().notEmpty().withMessage("Portal ID is required"),
  body("type").optional().isIn(["info", "warning", "promotion", "update"]),
  body("targetAudience").optional().trim(),
  body("startDate").optional().isISO8601(),
  body("endDate").optional().isISO8601(),
  validate,
];

module.exports = {
  loginValidation,
  addSuperAdminValidation,
  addUserValidation,
  changePasswordValidation,
  updateUserDetailValidation,
  mongoIdParam,
  websiteValidation,
  bucketNameParam,
  portalValidation,
  bannerValidation,
  nudgeValidation,
};
