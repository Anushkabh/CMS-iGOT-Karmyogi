const mongoose = require("mongoose");

const portalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  portalId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Website",
  },
  isActive: {
    type: Boolean,
    default: true,
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

portalSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

portalSchema.index({ portalId: 1 });
portalSchema.index({ isActive: 1 });

module.exports = mongoose.model("Portal", portalSchema);
