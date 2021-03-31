const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  phoneNumber: String,
  name: {
    type: String,
    unique: true,
    required: [true, 'Iltimos foydalanuvchi ismini kiriting!']
  },
  password: {
    type: String,
    required: [true, 'Iltimos parolni kiriting!'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    required: true
  },
  modules: [{
    name: String,
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    }
  }],
  buyingModules: [{
    name: String,
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    paystate: {
      type: Number,
      enum: [-2, -1, 0, 1, 2],
      default: undefined
    },
    create_time:{
      type: Date,
      default: undefined
    }
  }]
}, {
  timestamps: true
})

// Hashing password with bcrypt
UserSchema.pre('save', async function(next){
  if(!this.isModified('password')) next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Sign & Get JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  })
}

// Match user entered password with hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword){
  return await bcrypt.compare(enteredPassword, this.password)
}

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hash token and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}

module.exports = mongoose.model('User', UserSchema)