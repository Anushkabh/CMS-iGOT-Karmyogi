const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
    unique: true, // Ensure that each website has a unique entry
  },
  currentTheme: {
    type: String,
    required: true,
  },
  history: [
    {
      theme: {
        type: String,
        required: true,
      },
      dateSet: {
        type: Date,
        default: Date.now, 
      },
    },
  ],
});

// Create a model from the schema
const Theme = mongoose.model('Theme', themeSchema);

module.exports = Theme;
