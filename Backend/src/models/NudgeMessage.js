const mongoose = require("mongoose");

const nudgeMessageSchema = new mongoose.Schema({
  portalId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["info", "warning", "promotion", "update"],
    default: "info",
  },
  targetAudience: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

nudgeMessageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

nudgeMessageSchema.index({ portalId: 1, isActive: 1 });
nudgeMessageSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("NudgeMessage", nudgeMessageSchema);
