# Free Cron Job Setup for LinkedIn Auto-Posting

Since Vercel's cron jobs are a paid feature, here are free alternatives to achieve automatic posting:

## Option 1: GitHub Actions (Recommended - FREE)

### Setup Steps:

1. **Push your code to GitHub** (if not already done)

2. **Add GitHub Secrets**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `MONGODB_URI`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (your Vercel app URL)
     - `LINKEDIN_CLIENT_ID`
     - `LINKEDIN_CLIENT_SECRET`
     - `CRON_SECRET` (any random string)
     - `VERCEL_URL` (your Vercel app URL)

3. **The workflow will automatically run every minute** and trigger your cron job

4. **Manual Trigger**: You can also manually trigger the workflow from GitHub Actions tab

## Option 2: Cron-job.org (FREE)

### Setup Steps:

1. **Go to [cron-job.org](https://cron-job.org)** and create a free account

2. **Add Environment Variable**:
   ```bash
   EXTERNAL_CRON_TOKEN=your_random_token_here
   ```

3. **Create a new cron job**:
   - **URL**: `https://your-app.vercel.app/api/external-cron?token=your_random_token_here`
   - **Schedule**: Every minute (`* * * * *`)
   - **Method**: GET

4. **Save and activate** the cron job

## Option 3: EasyCron (FREE tier)

### Setup Steps:

1. **Go to [EasyCron.com](https://www.easycron.com)** and create a free account

2. **Add Environment Variable**:
   ```bash
   EXTERNAL_CRON_TOKEN=your_random_token_here
   ```

3. **Create a new cron job**:
   - **URL**: `https://your-app.vercel.app/api/external-cron?token=your_random_token_here`
   - **Schedule**: Every minute
   - **Method**: GET

## Option 4: UptimeRobot (FREE)

### Setup Steps:

1. **Go to [UptimeRobot.com](https://uptimerobot.com)** and create a free account

2. **Add Environment Variable**:
   ```bash
   EXTERNAL_CRON_TOKEN=your_random_token_here
   ```

3. **Create a new monitor**:
   - **URL**: `https://your-app.vercel.app/api/external-cron?token=your_random_token_here`
   - **Check Interval**: 5 minutes (minimum for free tier)

## Testing Your Setup

1. **Create a test scheduled post** using the script:
   ```bash
   node scripts/create-test-scheduled-post.js
   ```

2. **Wait for the cron job to execute** (within 1-5 minutes depending on service)

3. **Check your LinkedIn profile** for the posted content

4. **Check the logs** in your Vercel dashboard

## Environment Variables Required

Add these to your Vercel environment variables:

```bash
# For GitHub Actions
MONGODB_URI=your_mongodb_uri
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app.vercel.app
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
CRON_SECRET=your_random_cron_secret
VERCEL_URL=https://your-app.vercel.app

# For external cron services
EXTERNAL_CRON_TOKEN=your_random_token_here
```

## Recommended Choice

**GitHub Actions** is the best option because:
- ✅ Completely FREE
- ✅ Reliable and fast
- ✅ Easy to monitor and debug
- ✅ No external dependencies
- ✅ Can be manually triggered
- ✅ Integrates well with your existing GitHub workflow

## Troubleshooting

1. **Check GitHub Actions logs** for any errors
2. **Verify environment variables** are set correctly
3. **Test the endpoint manually** first
4. **Check Vercel function logs** for execution details
