# Vercel Deployment Guide

## Environment Variables Setup

To fix the build error on Vercel, you need to configure the following environment variables in your Vercel project:

### Required Environment Variables

1. **MONGODB_URI**
   - Your MongoDB connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

2. **NEXTAUTH_SECRET**
   - A random string for NextAuth.js encryption
   - Generate one: `openssl rand -base64 32`

3. **NEXTAUTH_URL**
   - Your production URL (e.g., `https://your-app.vercel.app`)

### How to Set Environment Variables on Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
   - **Environment**: Production, Preview, Development
   - **Encrypt**: Yes

   Repeat for `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

### Optional Environment Variables

- `NEXTAUTH_URL`: Your production URL
- `RAZORPAY_KEY_ID`: If using Razorpay payments
- `RAZORPAY_KEY_SECRET`: If using Razorpay payments
- `CLOUDINARY_URL`: If using Cloudinary for images
- `OPENAI_API_KEY`: If using OpenAI for content generation

### Health Check

After deployment, you can check if everything is working by visiting:
`https://your-app.vercel.app/api/health`

This will show you the status of your environment variables and configuration.

### Common Issues

1. **Build Error**: Usually caused by missing environment variables
2. **Database Connection Error**: Check your MongoDB URI format
3. **Authentication Error**: Ensure NEXTAUTH_SECRET is set

### Redeploy After Changes

After setting environment variables, redeploy your application:
1. Go to your Vercel dashboard
2. Click **Deployments**
3. Click **Redeploy** on your latest deployment

### Local Development

For local development, create a `.env.local` file with the same variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```
