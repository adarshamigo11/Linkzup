import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"

// Helper function to post to LinkedIn
async function postToLinkedIn(scheduledPost: any, user: any) {
  try {
    console.log("📤 Force posting to LinkedIn:", {
      postId: scheduledPost._id,
      contentLength: scheduledPost.content.length,
      hasImage: !!scheduledPost.imageUrl,
      linkedinId: user.linkedinProfile?.id,
    })

    // Prepare LinkedIn post data
    const LINKEDIN_UGC_POST_URL = "https://api.linkedin.com/v2/ugcPosts"

    const postBody: any = {
      author: `urn:li:person:${user.linkedinProfile?.id}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: scheduledPost.content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    console.log("📝 LinkedIn post body:", JSON.stringify(postBody, null, 2))

    // Post to LinkedIn
    const response = await fetch(LINKEDIN_UGC_POST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.linkedinAccessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    })

    console.log("📡 LinkedIn response status:", response.status)

    if (response.ok) {
      const linkedinResponse = await response.json()
      console.log("✅ Successfully posted to LinkedIn:", linkedinResponse.id)

      // Generate LinkedIn post URL
      const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinResponse.id}/`

      return {
        success: true,
        linkedinPostId: linkedinResponse.id,
        linkedinUrl: linkedinUrl,
        linkedinResponse: linkedinResponse,
      }
    } else {
      const errorData = await response.text()
      console.error("❌ Failed to post to LinkedIn:", response.status, errorData)
      
      return {
        success: false,
        error: `LinkedIn posting failed: ${response.status} ${response.statusText}`,
        details: errorData,
        status: response.status,
      }
    }
  } catch (error: any) {
    console.error("❌ Error posting to LinkedIn:", error)
    return {
      success: false,
      error: error.message || "Failed to post to LinkedIn",
    }
  }
}

export async function GET(req: Request) {
  try {
    console.log("🚀 Force post endpoint activated at", ISTTime.getCurrentISTString())

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()
    console.log("⏰ Current UTC time:", currentUTC.toISOString())

    // Find the most recent overdue post
    const overduePost = await ScheduledPost.findOne({
      status: "pending",
      scheduledTime: { $lte: currentUTC },
      attempts: { $lt: 3 },
    }).sort({ scheduledTime: 1 })

    if (!overduePost) {
      return NextResponse.json({
        success: false,
        message: "No overdue posts found to force post",
        currentTime: ISTTime.getCurrentISTString(),
      })
    }

    console.log(`🔍 Found overdue post: ${overduePost._id}`)

    // Get user with LinkedIn credentials
    const user = await User.findById(overduePost.userId).select(
      "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile",
    )

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found",
        postId: overduePost._id,
      })
    }

    // Check LinkedIn connection
    if (
      !user.linkedinAccessToken ||
      !user.linkedinTokenExpiry ||
      new Date(user.linkedinTokenExpiry) <= new Date()
    ) {
      return NextResponse.json({
        success: false,
        error: "LinkedIn not connected or token expired",
        userEmail: user.email,
        linkedinStatus: {
          hasToken: !!user.linkedinAccessToken,
          tokenExpiry: user.linkedinTokenExpiry,
          isExpired: user.linkedinTokenExpiry ? new Date(user.linkedinTokenExpiry) <= new Date() : true,
          hasProfile: !!user.linkedinProfile?.id,
          profileId: user.linkedinProfile?.id,
        }
      })
    }

    console.log("✅ LinkedIn connection verified, attempting to post...")

    // Force post to LinkedIn
    const postResult = await postToLinkedIn(overduePost, user)

    if (postResult.success) {
      // Update scheduled post as posted
      await ScheduledPost.findByIdAndUpdate(overduePost._id, {
        status: "posted",
        linkedinPostId: postResult.linkedinPostId,
        linkedinUrl: postResult.linkedinUrl,
        postedAt: new Date(),
        error: null,
      })

      return NextResponse.json({
        success: true,
        message: "Post successfully posted to LinkedIn!",
        postId: overduePost._id,
        linkedinPostId: postResult.linkedinPostId,
        linkedinUrl: postResult.linkedinUrl,
        content: overduePost.content.substring(0, 100) + "...",
      })
    } else {
      // Update scheduled post as failed
      await ScheduledPost.findByIdAndUpdate(overduePost._id, {
        status: "failed",
        error: postResult.error,
        attempts: overduePost.attempts + 1,
        lastAttempt: new Date(),
      })

      return NextResponse.json({
        success: false,
        error: "Failed to post to LinkedIn",
        details: postResult,
        postId: overduePost._id,
        content: overduePost.content.substring(0, 100) + "...",
      })
    }
  } catch (error: any) {
    console.error("❌ Force post error:", error)
    return NextResponse.json({ error: error.message || "Force post failed" }, { status: 500 })
  }
}
