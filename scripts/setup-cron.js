const cron = require('node-cron');

// This is a helper script to set up local cron for testing
// In production, you should use external cron services

console.log('🔄 Setting up local cron job for scheduled posts...');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('⏰ Cron job triggered at:', new Date().toISOString());
    
    // Call your cron endpoint
    const response = await fetch('http://localhost:3000/api/cron/auto-post', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer dev-cron-secret'
      }
    });
    
    const result = await response.json();
    console.log('✅ Cron job result:', result);
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
});

console.log('✅ Local cron job set up successfully!');
console.log('📝 This will run every 5 minutes');
console.log('🚀 Make sure your app is running on localhost:3000');

// Keep the script running
process.on('SIGINT', () => {
  console.log('🛑 Stopping cron job...');
  process.exit(0);
});
