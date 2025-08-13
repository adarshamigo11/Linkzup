const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create a test scheduled post
async function createTestScheduledPost() {
  try {
    await connectDB();

    // Get the first user (you can modify this to target a specific user)
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      linkedinAccessToken: String,
      linkedinTokenExpiry: Date,
      linkedinProfile: {
        id: String
      }
    }));
    
    const user = await User.findOne({ linkedinAccessToken: { $exists: true, $ne: null } });
    
    if (!user) {
      console.error('❌ No users with LinkedIn connection found in database');
      return;
    }

    console.log('👤 Using user:', user.email);

    // Create a scheduled post that's due immediately (5 minutes ago)
    const ScheduledPost = mongoose.model('ScheduledPost', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      userEmail: String,
      contentId: String,
      content: String,
      imageUrl: String,
      scheduledTime: Date,
      scheduledTimeIST: String,
      status: String,
      platform: String,
      attempts: Number,
      maxAttempts: Number,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));
    
    const testPost = new ScheduledPost({
      userId: user._id,
      userEmail: user.email,
      contentId: null,
      content: "🚀 Test scheduled post - This is an automated test post to verify the cron job functionality! #LinkedInAutomation #TestPost",
      imageUrl: null,
      scheduledTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      scheduledTimeIST: new Date(Date.now() - 5 * 60 * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      status: "pending",
      platform: "linkedin",
      attempts: 0,
      maxAttempts: 3,
    });

    await testPost.save();
    
    console.log('✅ Test scheduled post created:', {
      id: testPost._id,
      content: testPost.content.substring(0, 50) + '...',
      scheduledTime: testPost.scheduledTime,
      status: testPost.status
    });

    console.log('\n📋 Next steps:');
    console.log('1. Visit: http://localhost:3000/api/test-cron');
    console.log('2. Check the terminal for auto-post execution logs');
    console.log('3. Check your LinkedIn profile for the test post');

  } catch (error) {
    console.error('❌ Error creating test scheduled post:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestScheduledPost();
