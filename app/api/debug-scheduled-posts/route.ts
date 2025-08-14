import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"

export async function GET(req: Request) {
  try {
    console.log("🔍 Debug scheduled posts at", ISTTime.getCurrentISTString())

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()
    console.log("⏰ Current UTC time:", currentUTC.toISOString())

    // Find all scheduled posts with detailed status
    const allScheduledPosts = await ScheduledPost.find({}).sort({ scheduledTime: 1 })

    // Find overdue posts
    const overduePosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: currentUTC },
      attempts: { $lt: 3 },
    }).sort({ scheduledTime: 1 })

    // Find failed posts
    const failedPosts = await ScheduledPost.find({
      status: "failed",
    }).sort({ lastAttempt: -1 })

    // Get detailed user info for overdue posts
    const overduePostsWithUserInfo = await Promise.all(
      overduePosts.map(async (post) => {
        const user = await User.findById(post.userId).select(
          "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile"
        )
        
        return {
          postId: post._id,
          content: post.content.substring(0, 100) + "...",
          scheduledTime: post.scheduledTime,
          scheduledTimeIST: post.scheduledTimeIST,
          status: post.status,
          attempts: post.attempts,
          error: post.error,
          lastAttempt: post.lastAttempt,
          user: user ? {
            email: user.email,
            hasLinkedInToken: !!user.linkedinAccessToken,
            linkedinTokenExpiry: user.linkedinTokenExpiry,
            isTokenExpired: user.linkedinTokenExpiry ? new Date(user.linkedinTokenExpiry) <= new Date() : true,
            hasLinkedInProfile: !!user.linkedinProfile?.id,
            linkedinProfileId: user.linkedinProfile?.id,
          } : null
        }
      })
    )

    return NextResponse.json({
      success: true,
      debug: {
        currentTime: ISTTime.getCurrentISTString(),
        currentUTC: currentUTC.toISOString(),
        totalScheduledPosts: allScheduledPosts.length,
        overduePosts: overduePosts.length,
        failedPosts: failedPosts.length,
        overduePostsDetails: overduePostsWithUserInfo,
        failedPostsDetails: failedPosts.map(post => ({
          postId: post._id,
          content: post.content.substring(0, 100) + "...",
          scheduledTime: post.scheduledTime,
          status: post.status,
          attempts: post.attempts,
          error: post.error,
          lastAttempt: post.lastAttempt,
        })),
        allPostsSummary: allScheduledPosts.map(post => ({
          postId: post._id,
          status: post.status,
          scheduledTime: post.scheduledTime,
          attempts: post.attempts,
          error: post.error,
        }))
      }
    })
  } catch (error: any) {
    console.error("❌ Debug error:", error)
    return NextResponse.json({ error: error.message || "Debug failed" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    console.log("🚀 Manual debug execution at", ISTTime.getCurrentISTString())

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()

    // Find overdue posts
    const overduePosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: currentUTC },
      attempts: { $lt: 3 },
    }).sort({ scheduledTime: 1 })

    if (overduePosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No overdue posts found",
        currentTime: ISTTime.getCurrentISTString(),
      })
    }

    const results = []

    // Process each overdue post with detailed logging
    for (const post of overduePosts) {
      try {
        console.log(`🔍 Debugging post ${post._id}`)

        const user = await User.findById(post.userId).select(
          "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile"
        )

        if (!user) {
          results.push({
            postId: post._id,
            status: "error",
            error: "User not found",
            userInfo: null
          })
          continue
        }

        // Check LinkedIn connection
        const linkedinStatus = {
          hasToken: !!user.linkedinAccessToken,
          tokenExpiry: user.linkedinTokenExpiry,
          isExpired: user.linkedinTokenExpiry ? new Date(user.linkedinTokenExpiry) <= new Date() : true,
          hasProfile: !!user.linkedinProfile?.id,
          profileId: user.linkedinProfile?.id,
        }

        results.push({
          postId: post._id,
          status: "analyzed",
          content: post.content.substring(0, 100) + "...",
          scheduledTime: post.scheduledTime,
          attempts: post.attempts,
          error: post.error,
          linkedinStatus,
          userEmail: user.email
        })

      } catch (error: any) {
        results.push({
          postId: post._id,
          status: "error",
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Analyzed ${overduePosts.length} overdue posts`,
      results,
      currentTime: ISTTime.getCurrentISTString(),
    })
  } catch (error: any) {
    console.error("❌ Manual debug error:", error)
    return NextResponse.json({ error: error.message || "Manual debug failed" }, { status: 500 })
  }
}
