const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  user_id: String,
  module_id: String,
  status: String,
  paycom_state: String,
  paycom_create_time: Number,
  paycom_id: String,
  paycom_perform_time: { type: Number, default: 0 },
  paycom_reason: { type: Number},
  paycom_cancel_time: { type: Number, default: 0 },
  amount: Number,
},{
  timestamps: true
})

module.exports = mongoose.model('Transaction', transactionSchema)