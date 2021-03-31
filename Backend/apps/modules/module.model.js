
const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ["applicants", "students"],
    required: true,
  },
  sold: {
    type: Number,
    default: 0
  },

  topics: [{
    id: String,
    name: String,
    description: String,
    file: String,

    lessons: [{
      id: String,
      name: String,
      description: String,
      video: String
    }]
  }],
}, {
  timestamps: true
})

module.exports = mongoose.model('Module', Schema)