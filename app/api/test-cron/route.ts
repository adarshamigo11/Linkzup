import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"

export async function GET(req: Request) {
  try {
    console.log("🧪 Manual cron test triggered at", ISTTime.getCurrentISTString())

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()
    console.log("⏰ Current UTC time:", currentUTC.toISOString())

    // Find all pending scheduled posts that are due
    const dueScheduledPosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: currentUTC },
      attempts: { $lt: 3 },
    }).sort({ scheduledTime: 1 })

    console.log(`📋 Found ${dueScheduledPosts.length} due scheduled posts`)

    // Also check for overdue posts
    const overduePosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: new Date(currentUTC.getTime() - 24 * 60 * 60 * 1000) },
      attempts: { $lt: 3 },
    })

    // Get all scheduled posts for debugging
    const allScheduledPosts = await ScheduledPost.find({}).sort({ scheduledTime: 1 }).limit(10)

    return NextResponse.json({
      success: true,
      message: "Manual cron test completed",
      currentTime: ISTTime.getCurrentISTString(),
      currentUTC: currentUTC.toISOString(),
      duePosts: dueScheduledPosts.length,
      overduePosts: overduePosts.length,
      allScheduledPosts: allScheduledPosts.map(post => ({
        id: post._id,
        content: post.content.substring(0, 50) + "...",
        scheduledTime: post.scheduledTime,
        scheduledTimeIST: post.scheduledTimeIST,
        status: post.status,
        attempts: post.attempts,
        userId: post.userId,
      })),
      dueScheduledPosts: dueScheduledPosts.map(post => ({
        id: post._id,
        content: post.content.substring(0, 50) + "...",
        scheduledTime: post.scheduledTime,
        scheduledTimeIST: post.scheduledTimeIST,
        status: post.status,
        attempts: post.attempts,
        userId: post.userId,
      })),
    })
  } catch (error: any) {
    console.error("❌ Manual cron test error:", error)
    return NextResponse.json({ error: error.message || "Manual cron test failed" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    console.log("🚀 Manual cron execution triggered at", ISTTime.getCurrentISTString())

    // Call the actual cron job
    const cronUrl = new URL(req.url)
    const baseUrl = `${cronUrl.protocol}//${cronUrl.host}`
    const cronEndpoint = `${baseUrl}/api/cron/auto-post`
    
    const cronSecret = process.env.CRON_SECRET || "dev-cron-secret"
    
    const response = await fetch(cronEndpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
      },
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: "Manual cron execution completed",
      cronResponse: result,
      timestamp: ISTTime.getCurrentISTString(),
    })
  } catch (error: any) {
    console.error("❌ Manual cron execution error:", error)
    return NextResponse.json({ error: error.message || "Manual cron execution failed" }, { status: 500 })
  }
}

