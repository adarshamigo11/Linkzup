// Usage: node scripts/reset-admin-password.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linky-linky');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Admin Schema
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ["super_admin", "admin"],
    default: "admin",
  },
  profilePhoto: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// Reset admin password
const resetAdminPassword = async () => {
  try {
    await connectDB();

    // Find the admin user
    const admin = await Admin.findOne({ email: 'admin@zuperstudio.com' });
    
    if (!admin) {
      console.log('Admin user not found. Creating new admin...');
      const newAdmin = new Admin({
        name: 'Admin User',
        email: 'admin@zuperstudio.com',
        password: 'admin123@1',
        role: 'super_admin',
        isActive: true,
      });
      await newAdmin.save();
      console.log('New admin user created successfully:', newAdmin.email);
      console.log('Password: admin123@1');
    } else {
      // Reset password
      const newPassword = 'admin123@1';
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
      await admin.save();
      console.log('Admin password reset successfully:', admin.email);
      console.log('New Password: admin123@1');
    }
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the script
resetAdminPassword();
