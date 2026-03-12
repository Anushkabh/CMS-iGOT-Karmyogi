const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  portalId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  linkUrl: {
    type: String,
    default: "",
  },
  displayOrder: {
    type: Number,
    default: 0,
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

bannerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

bannerSchema.index({ portalId: 1, isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
