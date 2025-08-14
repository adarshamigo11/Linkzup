# 🔧 Cron-Job.org Setup Guide for 5-Minute Posting

## 🎯 Goal
Set up cron-job.org to automatically post overdue content to LinkedIn within 5 minutes of the scheduled time.

## 📋 Prerequisites
- Account on [cron-job.org](https://console.cron-job.org/jobs)
- Your app deployed on Vercel
- Environment variables configured

## 🚀 Step-by-Step Setup

### Step 1: Create New Cron Job

1. **Go to [cron-job.org](https://console.cron-job.org/jobs)**
2. **Click "Create cronjob"**
3. **Fill in the details:**

   **Title:** `LinkzUp Auto Post`
   
   **URL:** `https://linkzup.vercel.app/api/cron/auto-post`
   
   **Schedule:** `Every 5 minutes` (or `*/5 * * * *` in cron syntax)

### Step 2: Configure Headers

In the "Headers" section, add:

**Name:** `Authorization`
**Value:** `Bearer dev-cron-secret`

### Step 3: Advanced Settings

**Request Method:** `GET`

**Timeout:** `120 seconds` (2 minutes)

**Retry on failure:** `Yes` (3 retries)

**Save the cron job**

## 🔧 Alternative Setup (Query Parameter)

If headers don't work, use query parameter:

**URL:** `https://linkzup.vercel.app/api/cron/auto-post?auth=dev-cron-secret`

## 📊 Expected Behavior

### How It Works:
1. **Every 5 minutes**, cron-job.org hits your endpoint
2. **Finds overdue posts** (posts due more than 5 minutes ago)
3. **Prioritizes overdue posts** over regular due posts
4. **Posts to LinkedIn** immediately
5. **Updates status** to "posted" or "failed"

### Timeline:
- **Post scheduled for 2:00 PM**
- **2:05 PM:** Cron job runs, finds overdue post
- **2:05 PM:** Post is immediately sent to LinkedIn
- **2:05 PM:** Status updated to "posted"

## 🧪 Testing Your Setup

### Test 1: Manual Trigger
Visit this URL to test manually:
```
https://linkzup.vercel.app/api/cron/auto-post?auth=dev-cron-secret
```

### Test 2: Check Cron Job Status
1. Go to [cron-job.org dashboard](https://console.cron-job.org/jobs)
2. Check "Last execution" time
3. Check "Status" (should be green)
4. Check "Response" for success message

### Test 3: Create Test Post
1. Schedule a post for 1 minute from now
2. Wait 6 minutes
3. Check if post appears on LinkedIn
4. Check cron job logs

## 🔍 Monitoring & Debugging

### Check Cron Job Logs
1. Go to your cron job on cron-job.org
2. Click "Logs" tab
3. Look for:
   - ✅ `200 OK` responses
   - ✅ `"success": true`
   - ❌ `401 Unauthorized` (auth issue)
   - ❌ `500 Internal Server Error` (server issue)

### Check Your App Logs
1. Go to Vercel Dashboard
2. Check Function Logs for `/api/cron/auto-post`
3. Look for:
   - `🔄 External cron job triggered`
   - `✅ Cron job authenticated successfully`
   - `📋 Found X due scheduled posts`
   - `⚠️ Found X overdue posts`

## 🚨 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Problem:** Cron job getting authentication errors
**Solution:**
- Check if `CRON_SECRET` is set in Vercel
- Verify header format: `Authorization: Bearer dev-cron-secret`
- Try query parameter: `?auth=dev-cron-secret`

### Issue 2: Cron Job Not Running
**Problem:** Cron job not executing
**Solution:**
- Check if cron job is enabled on cron-job.org
- Verify schedule is set to every 5 minutes
- Check if URL is accessible

### Issue 3: Posts Not Being Found
**Problem:** Cron job runs but finds no posts
**Solution:**
- Check if posts have `status: "pending"`
- Check if `scheduledTime` is in the past
- Verify posts are being created correctly

### Issue 4: LinkedIn Posting Fails
**Problem:** Posts found but LinkedIn posting fails
**Solution:**
- Check LinkedIn connection status
- Verify LinkedIn tokens are valid
- Check LinkedIn app permissions

## 📋 Environment Variables

Make sure these are set in Vercel:

```env
# Required for cron job
CRON_SECRET=dev-cron-secret

# Required for LinkedIn posting
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://linkzup.vercel.app/api/auth/linkedin/callback
NEXTAUTH_URL=https://linkzup.vercel.app

# Required for app functionality
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
```

## 🎯 Expected Results

After setup:
- ✅ Cron job runs every 5 minutes
- ✅ Overdue posts are found and posted immediately
- ✅ Regular due posts are posted on time
- ✅ Status is updated correctly
- ✅ Posts appear on LinkedIn within 5 minutes of being overdue

## 🔄 Cron Job Schedule Options

### Every 5 Minutes (Recommended)
```
*/5 * * * *
```

### Every 2 Minutes (More Aggressive)
```
*/2 * * * *
```

### Every 10 Minutes (Less Aggressive)
```
*/10 * * * *
```

## 📊 Monitoring Dashboard

Create a simple monitoring page:

```javascript
// Visit this URL to check status
https://linkzup.vercel.app/api/debug-scheduled-posts
```

This will show:
- Total scheduled posts
- Due posts count
- Overdue posts count
- Failed posts count
- LinkedIn connection status

## 🆘 Emergency Contacts

If cron job stops working:
1. **Check cron-job.org status** - [status.cron-job.org](https://status.cron-job.org)
2. **Check Vercel status** - [vercel-status.com](https://vercel-status.com)
3. **Check your app logs** in Vercel Dashboard
4. **Test manually** using the test endpoints

## 📞 Support

If you need help:
1. Check the logs first
2. Test the endpoints manually
3. Verify environment variables
4. Check LinkedIn connection status

**Your cron job should now post overdue content to LinkedIn within 5 minutes!**
