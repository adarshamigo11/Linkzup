import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import LinkedInDetails from "@/models/LinkedInDetails"
import { postToLinkedIn } from "@/lib/services/linkedin-service"

export async function POST() {
  try {
    await connectDB()

    // Find the most recent overdue post
    const now = new Date()
    const overduePost = await ScheduledPost.findOne({
      scheduledFor: { $lt: now },
      status: 'scheduled'
    }).populate('userId', 'email name')

    if (!overduePost) {
      return NextResponse.json({
        success: false,
        message: "No overdue posts found"
      })
    }

    // Check LinkedIn connection
    const linkedinDetails = await LinkedInDetails.findOne({ userId: overduePost.userId })
    
    if (!linkedinDetails?.accessToken) {
      return NextResponse.json({
        success: false,
        message: "LinkedIn not connected for this user",
        userEmail: overduePost.userId.email
      })
    }

    if (linkedinDetails.accessTokenExpires && new Date(linkedinDetails.accessTokenExpires) < now) {
      return NextResponse.json({
        success: false,
        message: "LinkedIn access token expired",
        userEmail: overduePost.userId.email,
        tokenExpires: linkedinDetails.accessTokenExpires
      })
    }

    console.log(`🚀 Force posting overdue post ${overduePost._id} for user ${overduePost.userId.email}`)

    // Attempt to post to LinkedIn
    try {
      const result = await postToLinkedIn(
        overduePost.content,
        linkedinDetails.accessToken,
        linkedinDetails.profileId
      )

      // Update post status
      await ScheduledPost.findByIdAndUpdate(overduePost._id, {
        status: 'posted',
        postedAt: new Date(),
        linkedinPostId: result.id,
        error: null
      })

      return NextResponse.json({
        success: true,
        message: "Post successfully posted to LinkedIn",
        postId: overduePost._id,
        linkedinPostId: result.id,
        content: overduePost.content.substring(0, 100) + '...',
        userEmail: overduePost.userId.email
      })

    } catch (postError: any) {
      console.error("LinkedIn posting error:", postError)

      // Update post status to failed
      await ScheduledPost.findByIdAndUpdate(overduePost._id, {
        status: 'failed',
        error: postError.message,
        lastAttempt: new Date()
      })

      return NextResponse.json({
        success: false,
        message: "Failed to post to LinkedIn",
        error: postError.message,
        postId: overduePost._id,
        userEmail: overduePost.userId.email
      })
    }

  } catch (error: any) {
    console.error("Force post error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
