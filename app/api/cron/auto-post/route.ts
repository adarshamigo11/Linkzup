import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"
import { LinkedInService } from "@/lib/services/linkedin-service"

export async function GET(req: Request) {
  try {
    console.log("🔄 External cron job triggered at", ISTTime.getCurrentISTString())
    
    // Check for auth header or query param for external cron services
    const authHeader = req.headers.get('authorization')
    const authQuery = new URL(req.url).searchParams.get('auth')
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret'
    
    // Allow both header and query param authentication for external cron services
    const isAuthenticated = authHeader === `Bearer ${cronSecret}` || authQuery === cronSecret
    
    if (!isAuthenticated) {
      console.log("❌ Cron job authentication failed")
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Use Authorization: Bearer dev-cron-secret header or ?auth=dev-cron-secret query param" 
      }, { status: 401 })
    }

    console.log("✅ Cron job authenticated successfully")

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()
    console.log("⏰ Current UTC time:", currentUTC.toISOString())

    // Find all pending scheduled posts that are due (including overdue ones)
    const dueScheduledPosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: currentUTC },
      attempts: { $lt: 3 }, // Don't retry more than 3 times
    }).sort({ scheduledTime: 1 })

    console.log(`📋 Found ${dueScheduledPosts.length} due scheduled posts`)

    // Also check for overdue posts that might have been missed (posts due more than 5 minutes ago)
    const fiveMinutesAgo = new Date(currentUTC.getTime() - 5 * 60 * 1000)
    const overduePosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: fiveMinutesAgo },
      attempts: { $lt: 3 },
    })

    if (overduePosts.length > 0) {
      console.log(`⚠️ Found ${overduePosts.length} overdue posts that need immediate attention`)
    }

    // Combine due and overdue posts, prioritizing overdue ones
    const allPostsToProcess = [...overduePosts, ...dueScheduledPosts.filter(post => 
      !overduePosts.some(overdue => overdue._id.toString() === post._id.toString())
    )]

    if (allPostsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled posts due",
        postsProcessed: 0,
        overduePosts: overduePosts.length,
        currentTime: ISTTime.getCurrentISTString(),
        cronService: "external-cron-job.org",
      })
    }

    console.log(`🚀 Processing ${allPostsToProcess.length} posts (${overduePosts.length} overdue, ${dueScheduledPosts.length} due)`)

    let successCount = 0
    let failureCount = 0
    const results = []

    // Process each scheduled post
    for (const scheduledPost of allPostsToProcess) {
      try {
        console.log(`🔄 Processing scheduled post ${scheduledPost._id} (scheduled for: ${scheduledPost.scheduledTime})`)

        // Get user with LinkedIn credentials
        const user = await User.findById(scheduledPost.userId).select(
          "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile",
        )

        if (!user) {
          console.error(`❌ User not found for scheduled post ${scheduledPost._id}`)
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: "User not found",
            attempts: scheduledPost.attempts + 1,
            lastAttempt: new Date(),
          })
          failureCount++
          results.push({ postId: scheduledPost._id, status: "failed", error: "User not found" })
          continue
        }

        // Check LinkedIn connection
        if (
          !user.linkedinAccessToken ||
          !user.linkedinTokenExpiry ||
          new Date(user.linkedinTokenExpiry) <= new Date()
        ) {
          console.error(`❌ LinkedIn not connected or token expired for user ${user.email}`)
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: "LinkedIn account not connected or token expired",
            attempts: scheduledPost.attempts + 1,
            lastAttempt: new Date(),
          })
          failureCount++
          results.push({ postId: scheduledPost._id, status: "failed", error: "LinkedIn not connected" })
          continue
        }

        // Update attempt count
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          attempts: scheduledPost.attempts + 1,
          lastAttempt: new Date(),
        })

        // Post to LinkedIn using the LinkedIn service
        const linkedinService = new LinkedInService()
        const postResult = await linkedinService.postToLinkedIn(
          scheduledPost.content,
          scheduledPost.imageUrl,
          user.linkedinAccessToken,
          user.linkedinProfile?.id
        )

        if (postResult.success) {
          // Update scheduled post as posted
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "posted",
            linkedinPostId: postResult.postId,
            linkedinUrl: postResult.url,
            postedAt: new Date(),
            error: null, // Clear any previous errors
          })

          console.log(`✅ Successfully posted scheduled content ${scheduledPost._id}`)
          successCount++
          results.push({ 
            postId: scheduledPost._id, 
            status: "posted", 
            linkedinPostId: postResult.postId,
            linkedinUrl: postResult.url
          })
        } else {
          // Update scheduled post as failed
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: postResult.error || "Failed to post to LinkedIn",
          })

          console.error(`❌ Failed to post scheduled content ${scheduledPost._id}:`, postResult.error)
          failureCount++
          results.push({ postId: scheduledPost._id, status: "failed", error: postResult.error })
        }
      } catch (error: any) {
        console.error(`❌ Error processing scheduled post ${scheduledPost._id}:`, error)

        // Update scheduled post as failed
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          status: "failed",
          error: error.message || "Unknown error occurred",
          attempts: scheduledPost.attempts + 1,
          lastAttempt: new Date(),
        })

        failureCount++
        results.push({ postId: scheduledPost._id, status: "failed", error: error.message })
      }
    }

    console.log(`✅ Cron job completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Processed ${allPostsToProcess.length} scheduled posts`,
      postsProcessed: allPostsToProcess.length,
      successCount,
      failureCount,
      overduePosts: overduePosts.length,
      duePosts: dueScheduledPosts.length,
      results,
      currentTime: ISTTime.getCurrentISTString(),
      cronService: "external-cron-job.org",
    })
  } catch (error: any) {
    console.error("❌ Cron job error:", error)
    return NextResponse.json({ 
      error: error.message || "Cron job failed",
      currentTime: ISTTime.getCurrentISTString(),
      cronService: "external-cron-job.org"
    }, { status: 500 })
  }
}
