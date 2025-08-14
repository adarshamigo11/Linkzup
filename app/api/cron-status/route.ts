import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import { ISTTime } from "@/lib/utils/ist-time"

export async function GET() {
  try {
    await connectDB()

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

    // Get all scheduled posts
    const allPosts = await ScheduledPost.find({}).sort({ scheduledTime: -1 })

    // Get recent activity
    const recentPosts = await ScheduledPost.find({
      $or: [
        { postedAt: { $gte: tenMinutesAgo } },
        { lastAttempt: { $gte: tenMinutesAgo } },
        { updatedAt: { $gte: tenMinutesAgo } }
      ]
    }).sort({ updatedAt: -1 })

    // Categorize posts
    const pendingPosts = allPosts.filter(post => post.status === 'pending')
    const duePosts = pendingPosts.filter(post => post.scheduledTime <= now)
    const overduePosts = pendingPosts.filter(post => post.scheduledTime < fiveMinutesAgo)
    const postedToday = allPosts.filter(post => 
      post.status === 'posted' && 
      post.postedAt && 
      post.postedAt >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    )
    const failedToday = allPosts.filter(post => 
      post.status === 'failed' && 
      post.lastAttempt && 
      post.lastAttempt >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    )

    // Check if cron job should have run recently
    const lastCronRun = new Date(now.getTime() - 7 * 60 * 1000) // 7 minutes ago
    const shouldHaveRun = overduePosts.length > 0 || duePosts.length > 0

    return NextResponse.json({
      success: true,
      currentTime: ISTTime.getCurrentISTString(),
      cronJobStatus: {
        shouldHaveRun,
        overduePostsCount: overduePosts.length,
        duePostsCount: duePosts.length,
        lastCheckTime: lastCronRun.toISOString(),
        recommendedAction: shouldHaveRun ? "Cron job should run immediately" : "Cron job is working normally"
      },
      summary: {
        totalPosts: allPosts.length,
        pendingPosts: pendingPosts.length,
        duePosts: duePosts.length,
        overduePosts: overduePosts.length,
        postedToday: postedToday.length,
        failedToday: failedToday.length
      },
      recentActivity: recentPosts.map(post => ({
        id: post._id,
        status: post.status,
        scheduledTime: post.scheduledTime,
        postedAt: post.postedAt,
        lastAttempt: post.lastAttempt,
        error: post.error,
        attempts: post.attempts
      })),
      overduePosts: overduePosts.map(post => ({
        id: post._id,
        scheduledTime: post.scheduledTime,
        overdueBy: Math.floor((now.getTime() - post.scheduledTime.getTime()) / (1000 * 60)) + ' minutes',
        attempts: post.attempts,
        error: post.error
      })),
      nextScheduledPosts: pendingPosts
        .filter(post => post.scheduledTime > now)
        .slice(0, 5)
        .map(post => ({
          id: post._id,
          scheduledTime: post.scheduledTime,
          scheduledIn: Math.floor((post.scheduledTime.getTime() - now.getTime()) / (1000 * 60)) + ' minutes'
        }))
    })

  } catch (error: any) {
    console.error("Cron status error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      currentTime: ISTTime.getCurrentISTString()
    }, { status: 500 })
  }
}
