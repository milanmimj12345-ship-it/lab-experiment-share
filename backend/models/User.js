const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  collegeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 10
  },
  group: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Hash phone number as password
userSchema.pre('save', async function(next) {
  if (!this.isModified('phone')) return next();
  this.phone = await bcrypt.hash(this.phone, 12);
  next();
});

userSchema.methods.matchPhone = async function(enteredPhone) {
  return await bcrypt.compare(enteredPhone, this.phone);
};

module.exports = mongoose.model('User', userSchema);
