// Usage: node scripts/create-admin-user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  isAdmin: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);
  const email = 'admin@zuperstudio.com';
  const password = 'Pass123@';
  const name = 'Admin';

  let user = await User.findOne({ email });
  const hashedPassword = await bcrypt.hash(password, 10);
  if (user) {
    user.password = hashedPassword;
    user.isAdmin = true;
    user.blocked = false;
    user.name = name;
    await user.save();
    console.log('Admin user updated.');
    process.exit(0);
  }

  user = new User({
    name,
    email,
    password: hashedPassword,
    isAdmin: true,
    blocked: false,
  });
  await user.save();
  console.log('Admin user created successfully.');
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Error creating admin user:', err);
  process.exit(1);
});
