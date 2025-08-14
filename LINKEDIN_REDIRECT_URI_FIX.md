# 🔧 LinkedIn Redirect URI Mismatch Fix

## The Problem
You're getting "The redirect_uri does not match the registered value" error because there's a mismatch between what your app is sending and what's registered in LinkedIn.

## 🔍 Step 1: Check Current Configuration

Visit this URL to see what redirect URI your app is using:
```
https://linkzup.vercel.app/api/test-linkedin-config
```

This will show you:
- What environment variables are set
- What redirect URI is being calculated
- What you need to fix

## ✅ Step 2: Fix Environment Variables

### Option A: Set LINKEDIN_REDIRECT_URI (Recommended)

In your Vercel environment variables, set:
```env
LINKEDIN_REDIRECT_URI=https://linkzup.vercel.app/api/auth/linkedin/callback
```

### Option B: Set NEXTAUTH_URL

If you don't set LINKEDIN_REDIRECT_URI, make sure NEXTAUTH_URL is set:
```env
NEXTAUTH_URL=https://linkzup.vercel.app
```

## 🔧 Step 3: Update LinkedIn App Settings

1. **Go to LinkedIn Developer Console**
2. **Select your app**
3. **Go to Auth → OAuth 2.0 settings**
4. **Add this EXACT redirect URL:**
   ```
   https://linkzup.vercel.app/api/auth/linkedin/callback
   ```
5. **Remove any other redirect URLs** (especially localhost ones)
6. **Save the changes**

## 🧪 Step 4: Test the Configuration

After setting environment variables and updating LinkedIn app:

1. **Redeploy your app** in Vercel
2. **Visit the test endpoint:**
   ```
   https://linkzup.vercel.app/api/test-linkedin-config
   ```
3. **Check that `calculatedRedirectUri` matches your LinkedIn app settings**

## 🚨 Common Issues & Solutions

### Issue 1: Multiple Redirect URLs in LinkedIn App
- **Problem**: LinkedIn app has multiple redirect URLs
- **Solution**: Remove all except `https://linkzup.vercel.app/api/auth/linkedin/callback`

### Issue 2: Environment Variables Not Set
- **Problem**: `LINKEDIN_REDIRECT_URI` or `NEXTAUTH_URL` not set
- **Solution**: Set them in Vercel environment variables

### Issue 3: Trailing Slash Mismatch
- **Problem**: One has trailing slash, other doesn't
- **Solution**: Make sure both are exactly the same

### Issue 4: HTTP vs HTTPS
- **Problem**: One uses http, other uses https
- **Solution**: Always use `https://linkzup.vercel.app`

## 📋 Complete Environment Variables Checklist

Make sure you have these in Vercel:

```env
# Required for LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://linkzup.vercel.app/api/auth/linkedin/callback
NEXTAUTH_URL=https://linkzup.vercel.app

# Required for app functionality
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
CRON_SECRET=dev-cron-secret
```

## 🔍 Debugging Steps

### Step 1: Check Current Config
Visit: `https://linkzup.vercel.app/api/test-linkedin-config`

### Step 2: Check LinkedIn App Settings
- Go to LinkedIn Developer Console
- Check OAuth 2.0 redirect URLs
- Make sure it matches exactly

### Step 3: Check Vercel Environment Variables
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify all variables are set correctly

### Step 4: Redeploy and Test
- Redeploy your app in Vercel
- Try connecting LinkedIn again

## 🎯 Expected Result

After fixing:
- ✅ `calculatedRedirectUri` should be `https://linkzup.vercel.app/api/auth/linkedin/callback`
- ✅ LinkedIn app should have the same redirect URL
- ✅ No more "redirect_uri does not match" errors
- ✅ LinkedIn connection should work

## 🆘 If Still Not Working

1. **Check the test endpoint** to see what redirect URI is being calculated
2. **Compare with LinkedIn app settings** - they must match exactly
3. **Make sure environment variables are set** for all environments (Production, Preview, Development)
4. **Redeploy after making changes**
5. **Clear browser cache** and try again
