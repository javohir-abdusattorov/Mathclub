const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  landing: {
    video: {
      isVisible: Boolean,
      video: String,
    },
    text: {
      isVisible: Boolean,
      text: String,
    },
  },
}, {
  timestamps: true
})

module.exports = mongoose.model('Config', Schema)