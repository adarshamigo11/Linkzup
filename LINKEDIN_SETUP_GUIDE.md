# 🔧 LinkedIn Redirect Fix Guide

## The Problem
Your LinkedIn connection is redirecting to `localhost:3000` instead of your production URL because the environment variables are not set correctly.

## ✅ IMMEDIATE FIX

### Step 1: Set Environment Variables in Vercel

Go to your Vercel Dashboard and add these environment variables:

**Required Variables:**
```env
NEXTAUTH_URL=https://linkzup.vercel.app
LINKEDIN_REDIRECT_URI=https://linkzup.vercel.app/api/auth/linkedin/callback
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### Step 2: Update LinkedIn App Settings

1. **Go to LinkedIn Developer Console**
2. **Select your app**
3. **Go to Auth → OAuth 2.0 settings**
4. **Add this redirect URL:**
   ```
   https://linkzup.vercel.app/api/auth/linkedin/callback
   ```
5. **Remove any localhost URLs**
6. **Save the changes**

### Step 3: Redeploy Your App

After setting the environment variables:
1. **Go to Vercel Dashboard**
2. **Click "Deployments"**
3. **Click "Redeploy" on your latest deployment**

## 🔍 How to Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add each variable:**

   **NEXTAUTH_URL:**
   - **Name**: `NEXTAUTH_URL`
   - **Value**: `https://linkzup.vercel.app`
   - **Environment**: Production, Preview, Development

   **LINKEDIN_REDIRECT_URI:**
   - **Name**: `LINKEDIN_REDIRECT_URI`
   - **Value**: `https://linkzup.vercel.app/api/auth/linkedin/callback`
   - **Environment**: Production, Preview, Development

   **LINKEDIN_CLIENT_ID:**
   - **Name**: `LINKEDIN_CLIENT_ID`
   - **Value**: Your LinkedIn app client ID
   - **Environment**: Production, Preview, Development

   **LINKEDIN_CLIENT_SECRET:**
   - **Name**: `LINKEDIN_CLIENT_SECRET`
   - **Value**: Your LinkedIn app client secret
   - **Environment**: Production, Preview, Development

## 🧪 Test the Fix

After setting the environment variables and redeploying:

1. **Go to your app**: `https://linkzup.vercel.app`
2. **Login to your account**
3. **Go to LinkedIn dashboard**
4. **Click "Connect LinkedIn"**
5. **Complete the LinkedIn authorization**
6. **You should be redirected back to**: `https://linkzup.vercel.app/dashboard/linkedin?linkedin=connected`

## 🚨 Common Issues

### Issue 1: Still redirecting to localhost
- **Solution**: Make sure `NEXTAUTH_URL` is set to `https://linkzup.vercel.app`
- **Check**: Vercel environment variables are saved and app is redeployed

### Issue 2: LinkedIn app error
- **Solution**: Add the correct redirect URL to your LinkedIn app settings
- **URL**: `https://linkzup.vercel.app/api/auth/linkedin/callback`

### Issue 3: Environment variables not working
- **Solution**: Redeploy your app after setting environment variables
- **Check**: Variables are set for all environments (Production, Preview, Development)

## 📋 Complete Environment Variables List

Make sure you have ALL these variables set in Vercel:

```env
# Required for LinkedIn
NEXTAUTH_URL=https://linkzup.vercel.app
LINKEDIN_REDIRECT_URI=https://linkzup.vercel.app/api/auth/linkedin/callback
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Required for app functionality
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
CRON_SECRET=dev-cron-secret

# Optional but recommended
NEXTAUTH_URL=https://linkzup.vercel.app
```

## 🎯 Expected Result

After fixing:
- ✅ LinkedIn connection will redirect to your production URL
- ✅ Users will be redirected back to the dashboard after connecting
- ✅ Scheduled posts will work with LinkedIn integration
- ✅ No more localhost redirects

## 🆘 If Still Not Working

1. **Check Vercel logs** for any errors
2. **Verify LinkedIn app settings** have the correct redirect URL
3. **Make sure all environment variables are set**
4. **Redeploy the app** after making changes
