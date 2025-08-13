# Production Deployment Guide

## 🚀 Quick Setup for Production

### 1. **Deploy to Vercel**
```bash
vercel --prod
```

### 2. **Add Environment Variables to Vercel**
Go to your Vercel dashboard → Project Settings → Environment Variables

**Required Variables:**
```bash
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
CRON_SECRET=your_random_cron_secret_key
VERCEL_URL=https://your-app.vercel.app
```

### 3. **Add GitHub Secrets**
Go to your GitHub repo → Settings → Secrets and variables → Actions

**Required Secrets:**
```bash
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
CRON_SECRET=your_random_cron_secret_key
VERCEL_URL=https://your-app.vercel.app
```

### 4. **Push to GitHub**
```bash
git add .
git commit -m "Production ready: Free auto-posting setup"
git push origin main
```

## ✅ What Happens After Deployment

1. **GitHub Actions** automatically starts running every minute
2. **Auto-posting system** becomes active
3. **Scheduled posts** will be automatically published to LinkedIn
4. **No Vercel cron charges** - completely free solution

## 🔧 Testing Your Setup

### Test Auto-Posting:
1. **Create a test scheduled post:**
   ```bash
   node scripts/create-test-scheduled-post.js
   ```

2. **Wait 1-2 minutes** for GitHub Actions to trigger

3. **Check your LinkedIn profile** for the posted content

4. **Monitor GitHub Actions** for execution logs

### Manual Testing:
- Visit `/dashboard/scheduled-posts`
- Click "Test Cron Job" button
- Check terminal logs for execution details

## 📊 Monitoring

### GitHub Actions:
- Go to your GitHub repo → Actions tab
- Monitor "LinkedIn Auto Post Cron Job" workflow
- Check execution logs for any errors

### Vercel Logs:
- Go to your Vercel dashboard → Functions
- Monitor `/api/cron/auto-post` endpoint
- Check for successful executions

### Application:
- Check `/dashboard/scheduled-posts` for post status
- Monitor LinkedIn profile for posted content

## 🛠️ Troubleshooting

### If posts aren't being published:

1. **Check GitHub Actions:**
   - Ensure workflow is running every minute
   - Check for any error messages
   - Verify all secrets are set correctly

2. **Check Vercel Environment Variables:**
   - Ensure all required variables are set
   - Verify MongoDB connection string
   - Check LinkedIn credentials

3. **Test manually:**
   - Use the "Test Cron Job" button
   - Check terminal logs for detailed errors

4. **Verify LinkedIn connection:**
   - Ensure LinkedIn tokens are valid
   - Check if tokens have expired
   - Reconnect LinkedIn if needed

## 🔒 Security Notes

- **CRON_SECRET**: Use a strong random string
- **NEXTAUTH_SECRET**: Use a strong random string
- **Environment Variables**: Never commit to Git
- **GitHub Secrets**: Keep secure and rotate regularly

## 📈 Performance

- **GitHub Actions**: Free tier includes 2000 minutes/month
- **Auto-posting**: Runs every minute (1440 times/day)
- **Cost**: Completely free for this usage

## 🎯 Success Indicators

✅ **GitHub Actions running every minute**  
✅ **Scheduled posts being published to LinkedIn**  
✅ **No errors in Vercel function logs**  
✅ **Posts appearing on LinkedIn profile**  
✅ **Status updates in scheduled posts dashboard**

---

**Your LinkedIn auto-posting system is now production-ready and completely free! 🎉**
