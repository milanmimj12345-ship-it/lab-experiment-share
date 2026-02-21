/**
 * Run this ONCE after first setup to create the admin account
 * Usage: cd backend && node scripts/createAdmin.js
 */
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const ADMIN = {
  collegeId: 'ADMIN001',
  username: 'Administrator',
  phone: '9999999999',  // ← CHANGE THIS to your actual phone number
  group: 'A',
  role: 'admin'
};

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ collegeId: ADMIN.collegeId });
    if (existing) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    await User.create(ADMIN);
    console.log('✅ Admin created successfully!');
    console.log(`   College ID: ${ADMIN.collegeId}`);
    console.log(`   Phone (password): ${ADMIN.phone}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
