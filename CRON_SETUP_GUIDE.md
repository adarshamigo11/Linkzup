# 🔧 Cron-job.org Setup Guide

## The Problem
Your cron job is failing because of incorrect URL format and authentication setup.

## ✅ Correct Setup for Cron-job.org

### Step 1: Create Account
1. Go to [cron-job.org](https://cron-job.org)
2. Sign up for a free account
3. Verify your email

### Step 2: Add New Cron Job

**URL (Important - use this exact format):**
```
https://linkzup.vercel.app/api/cron/auto-post
```

**NOT:**
```
@https://linkzup.vercel.app/api/cron/auto-post?auth=dev-cron-secret
```

### Step 3: Configure the Job

**Basic Settings:**
- **Title**: `LinkzUp Scheduled Posts`
- **URL**: `https://linkzup.vercel.app/api/cron/auto-post`
- **Schedule**: `*/5 * * * *` (every 5 minutes)

**Advanced Settings:**
- **Request Method**: `GET`
- **Timeout**: `30` seconds

### Step 4: Add Authentication Header

**In the "Headers" section, add:**
- **Name**: `Authorization`
- **Value**: `Bearer dev-cron-secret`

### Step 5: Test the Job

1. **Save the cron job**
2. **Click "Test"** to run it immediately
3. **Check the logs** to see if it works

## 🔍 Alternative: Use the Public Endpoint

If you're still having issues, use this simpler approach:

**URL:**
```
https://linkzup.vercel.app/api/trigger-posts
```

**No authentication needed!**

## 🚨 Common Issues & Solutions

### Issue 1: URL Format
❌ **Wrong**: `@https://linkzup.vercel.app/api/cron/auto-post?auth=dev-cron-secret`
✅ **Correct**: `https://linkzup.vercel.app/api/cron/auto-post`

### Issue 2: Authentication
❌ **Wrong**: Adding auth in URL
✅ **Correct**: Use Authorization header

### Issue 3: HTTPS
❌ **Wrong**: `http://linkzup.vercel.app/api/cron/auto-post`
✅ **Correct**: `https://linkzup.vercel.app/api/cron/auto-post`

## 📋 Step-by-Step Instructions

### Method 1: With Authentication (Recommended)

1. **Go to cron-job.org dashboard**
2. **Click "Add cronjob"**
3. **Fill in the details:**
   ```
   Title: LinkzUp Auto Post
   URL: https://linkzup.vercel.app/api/cron/auto-post
   Schedule: */5 * * * *
   ```
4. **Click "Advanced"**
5. **Add header:**
   ```
   Name: Authorization
   Value: Bearer dev-cron-secret
   ```
6. **Save and test**

### Method 2: Public Endpoint (Easier)

1. **Go to cron-job.org dashboard**
2. **Click "Add cronjob"**
3. **Fill in the details:**
   ```
   Title: LinkzUp Auto Post
   URL: https://linkzup.vercel.app/api/trigger-posts
   Schedule: */5 * * * *
   ```
4. **Save and test**

## 🧪 Testing Your Setup

### Test 1: Manual Trigger
Visit: `https://linkzup.vercel.app/api/trigger-posts`

### Test 2: Check Status
Visit: `https://linkzup.vercel.app/api/test-cron`

### Test 3: Cron Job Logs
Check the cron-job.org dashboard for execution logs.

## 📊 Expected Results

**Successful Response:**
```json
{
  "success": true,
  "message": "Processed X scheduled posts",
  "postsProcessed": 2,
  "successCount": 1,
  "failureCount": 1
}
```

**No Posts Due:**
```json
{
  "success": true,
  "message": "No scheduled posts due",
  "postsProcessed": 0
}
```

## 🔧 Troubleshooting

### If Still Failing:

1. **Check Vercel logs** for errors
2. **Verify environment variables** are set
3. **Test with the public endpoint** first
4. **Check cron-job.org logs** for HTTP status codes

### Common Error Codes:
- **401**: Authentication failed
- **500**: Server error
- **404**: URL not found

## 🎯 Quick Fix

**Use this URL in cron-job.org:**
```
https://linkzup.vercel.app/api/trigger-posts
```

**No headers needed, no authentication required!**
