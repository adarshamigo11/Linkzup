import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import LinkedInDetails from "@/models/LinkedInDetails"

export async function GET() {
  try {
    await connectDB()

    // Get current time
    const now = new Date()
    console.log("🕐 Current time:", now.toISOString())

    // Find all pending scheduled posts
    const allPendingPosts = await ScheduledPost.find({
      status: "pending"
    }).populate('userId', 'email name')

    console.log(`📋 Found ${allPendingPosts.length} pending posts`)

    // Find due posts
    const duePosts = allPendingPosts.filter(post => post.scheduledTime <= now)
    console.log(`⏰ Found ${duePosts.length} due posts`)

    // Check LinkedIn connections
    const linkedinChecks = await Promise.all(
      duePosts.map(async (post) => {
        const linkedinDetails = await LinkedInDetails.findOne({ userId: post.userId })
        
        return {
          postId: post._id,
          content: post.content.substring(0, 100) + '...',
          scheduledTime: post.scheduledTime,
          userEmail: post.userId.email,
          linkedinConnected: !!linkedinDetails?.accessToken,
          accessTokenExpired: linkedinDetails?.accessTokenExpires ? 
            new Date(linkedinDetails.accessTokenExpires) < now : true,
          hasValidToken: linkedinDetails?.accessToken && 
            (!linkedinDetails.accessTokenExpires || new Date(linkedinDetails.accessTokenExpires) > now),
          profileId: linkedinDetails?.profileId
        }
      })
    )

    return NextResponse.json({
      success: true,
      summary: {
        totalPendingPosts: allPendingPosts.length,
        duePosts: duePosts.length,
        postsWithLinkedIn: linkedinChecks.filter(p => p.linkedinConnected).length,
        postsWithValidToken: linkedinChecks.filter(p => p.hasValidToken).length
      },
      duePosts: linkedinChecks,
      currentTime: now.toISOString()
    })

  } catch (error: any) {
    console.error("Manual cron test error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    await connectDB()

    // Trigger the actual cron job
    const cronResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://linkzup.vercel.app'}/api/cron/auto-post`, {
      method: 'GET'
    })

    const cronResult = await cronResponse.json()

    return NextResponse.json({
      success: true,
      cronTriggered: true,
      cronResult
    })

  } catch (error: any) {
    console.error("Manual cron trigger error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
