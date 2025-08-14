# 🔧 Scheduled Posts Not Posting to LinkedIn - Troubleshooting Guide

## 🚨 IMMEDIATE DIAGNOSIS

### Step 1: Check Current Status
Visit these URLs to diagnose the issue:

1. **Check all scheduled posts:**
   ```
   https://linkzup.vercel.app/api/debug-scheduled-posts
   ```

2. **Check pending posts specifically:**
   ```
   https://linkzup.vercel.app/api/test-cron-manual
   ```

3. **Force post an overdue post:**
   ```
   https://linkzup.vercel.app/api/force-post-overdue
   ```
   (Use POST method)

### Step 2: Manual Cron Trigger
Visit this URL to manually trigger the cron job:
```
https://linkzup.vercel.app/api/test-cron-manual
```
(Use POST method)

## 🔍 COMMON ISSUES & SOLUTIONS

### Issue 1: No Pending Posts Found
**Symptoms:** Cron job says "No scheduled posts due"
**Solution:** 
- Check if posts are being created with correct status
- Posts should have `status: "pending"` (not "scheduled")
- Check scheduled time is in the past

### Issue 2: LinkedIn Not Connected
**Symptoms:** Posts found but LinkedIn not connected
**Solution:**
- User needs to reconnect LinkedIn
- Check if access token is expired
- Verify LinkedIn app settings

### Issue 3: LinkedIn Token Expired
**Symptoms:** LinkedIn connected but token expired
**Solution:**
- User needs to reconnect LinkedIn
- LinkedIn tokens expire after 60 days
- Check token expiry date

### Issue 4: Cron Job Not Running
**Symptoms:** No posts being processed
**Solution:**
- Check cron job setup
- Verify cron job URL is correct
- Check if cron job is hitting the endpoint

### Issue 5: LinkedIn API Errors
**Symptoms:** Posts failing with LinkedIn API errors
**Solution:**
- Check LinkedIn app permissions
- Verify app is approved for posting
- Check rate limits

## 🛠️ STEP-BY-STEP FIX

### Step 1: Check Current Posts
```bash
# Visit this URL to see all scheduled posts
https://linkzup.vercel.app/api/debug-scheduled-posts
```

Look for:
- Total scheduled posts
- Due posts count
- Overdue posts count
- Failed posts count
- LinkedIn connection status

### Step 2: Check Pending Posts
```bash
# Visit this URL to see pending posts
https://linkzup.vercel.app/api/test-cron-manual
```

Look for:
- Total pending posts
- Due posts
- LinkedIn connection status for each post

### Step 3: Manual Trigger
```bash
# POST to this URL to manually trigger cron
https://linkzup.vercel.app/api/test-cron-manual
```

### Step 4: Force Post
```bash
# POST to this URL to force post an overdue post
https://linkzup.vercel.app/api/force-post-overdue
```

## 🔧 CRON JOB SETUP VERIFICATION

### Check Cron Job URL
Your cron job should be hitting:
```
https://linkzup.vercel.app/api/cron/auto-post
```

### Check Cron Job Headers (if using cron-job.org)
```
Authorization: Bearer dev-cron-secret
```

### Alternative: Use Public Endpoint
If cron job is having issues, use this public endpoint:
```
https://linkzup.vercel.app/api/trigger-posts
```

## 📋 ENVIRONMENT VARIABLES CHECK

Make sure these are set in Vercel:
```env
# Required for LinkedIn posting
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://linkzup.vercel.app/api/auth/linkedin/callback
NEXTAUTH_URL=https://linkzup.vercel.app

# Required for app functionality
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
CRON_SECRET=dev-cron-secret
```

## 🧪 TESTING STEPS

### Test 1: Create a Test Post
1. Go to your dashboard
2. Schedule a post for 1 minute from now
3. Wait for it to be due
4. Check the debug endpoints

### Test 2: Manual Trigger
1. Visit `/api/test-cron-manual`
2. Check if posts are found
3. Use POST method to trigger cron
4. Check results

### Test 3: Force Post
1. Visit `/api/force-post-overdue`
2. Use POST method
3. Check if post is successful

## 🚨 EMERGENCY FIXES

### Fix 1: Reset All Pending Posts
If posts are stuck, you can reset them:
```javascript
// Run this in MongoDB
db.scheduledposts.updateMany(
  { status: "pending" },
  { $set: { status: "pending", attempts: 0, error: null } }
)
```

### Fix 2: Reconnect LinkedIn
1. Go to LinkedIn dashboard
2. Disconnect LinkedIn
3. Reconnect LinkedIn
4. Schedule a new test post

### Fix 3: Check LinkedIn App
1. Go to LinkedIn Developer Console
2. Check app permissions
3. Verify app is approved for posting
4. Check rate limits

## 📊 MONITORING

### Check Logs
Monitor these endpoints regularly:
- `/api/debug-scheduled-posts` - Overall status
- `/api/test-cron-manual` - Pending posts
- `/api/cron/auto-post` - Cron job results

### Expected Results
After fixing:
- ✅ Posts should have `status: "pending"` when created
- ✅ Cron job should find due posts
- ✅ LinkedIn should be connected with valid token
- ✅ Posts should be posted successfully
- ✅ Status should change to `"posted"`

## 🆘 IF STILL NOT WORKING

1. **Check Vercel logs** for any errors
2. **Verify MongoDB connection** is working
3. **Test LinkedIn API** directly
4. **Check if cron job is actually running**
5. **Verify all environment variables are set**

## 📞 NEXT STEPS

After running the diagnostic endpoints, share the results so I can help you identify the specific issue!
