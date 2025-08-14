import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import LinkedInDetails from "@/models/LinkedInDetails"

export async function GET() {
  try {
    await connectDB()

    // Get all scheduled posts
    const allScheduledPosts = await ScheduledPost.find({})
      .populate('userId', 'email name')
      .sort({ scheduledFor: 1 })

    // Get current time
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Categorize posts
    const duePosts = allScheduledPosts.filter(post => 
      post.scheduledFor <= now && post.status === 'scheduled'
    )

    const overduePosts = allScheduledPosts.filter(post => 
      post.scheduledFor < oneHourAgo && post.status === 'scheduled'
    )

    const failedPosts = allScheduledPosts.filter(post => 
      post.status === 'failed'
    )

    const successfulPosts = allScheduledPosts.filter(post => 
      post.status === 'posted'
    )

    // Check LinkedIn connections for users with scheduled posts
    const usersWithPosts = [...new Set(allScheduledPosts.map(post => post.userId.toString()))]
    const linkedinStatuses = await Promise.all(
      usersWithPosts.map(async (userId) => {
        const user = await User.findById(userId)
        const linkedinDetails = await LinkedInDetails.findOne({ userId })
        
        return {
          userId,
          userEmail: user?.email,
          linkedinConnected: !!linkedinDetails?.accessToken,
          accessTokenExpires: linkedinDetails?.accessTokenExpires,
          accessTokenExpired: linkedinDetails?.accessTokenExpires ? 
            new Date(linkedinDetails.accessTokenExpires) < now : true,
          hasValidToken: linkedinDetails?.accessToken && 
            (!linkedinDetails.accessTokenExpires || new Date(linkedinDetails.accessTokenExpires) > now)
        }
      })
    )

    return NextResponse.json({
      success: true,
      summary: {
        totalScheduledPosts: allScheduledPosts.length,
        duePosts: duePosts.length,
        overduePosts: overduePosts.length,
        failedPosts: failedPosts.length,
        successfulPosts: successfulPosts.length,
        usersWithLinkedInConnection: linkedinStatuses.filter(s => s.linkedinConnected).length,
        usersWithValidToken: linkedinStatuses.filter(s => s.hasValidToken).length
      },
      duePosts: duePosts.map(post => ({
        id: post._id,
        content: post.content.substring(0, 100) + '...',
        scheduledFor: post.scheduledFor,
        status: post.status,
        userId: post.userId,
        createdAt: post.createdAt
      })),
      overduePosts: overduePosts.map(post => ({
        id: post._id,
        content: post.content.substring(0, 100) + '...',
        scheduledFor: post.scheduledFor,
        status: post.status,
        userId: post.userId,
        createdAt: post.createdAt,
        overdueBy: Math.floor((now.getTime() - post.scheduledFor.getTime()) / (1000 * 60)) + ' minutes'
      })),
      failedPosts: failedPosts.map(post => ({
        id: post._id,
        content: post.content.substring(0, 100) + '...',
        scheduledFor: post.scheduledFor,
        status: post.status,
        error: post.error,
        userId: post.userId,
        createdAt: post.createdAt
      })),
      linkedinStatuses,
      currentTime: now,
      cronJobStatus: {
        lastCheck: fiveMinutesAgo,
        shouldHaveRun: duePosts.length > 0 || overduePosts.length > 0
      }
    })
  } catch (error: any) {
    console.error("Debug scheduled posts error:", error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    await connectDB()

    // Get overdue posts and check their LinkedIn status
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const overduePosts = await ScheduledPost.find({
      scheduledFor: { $lt: oneHourAgo },
      status: 'scheduled'
    }).populate('userId', 'email name')

    const analysis = await Promise.all(
      overduePosts.map(async (post) => {
        const linkedinDetails = await LinkedInDetails.findOne({ userId: post.userId })
        
        return {
          postId: post._id,
          content: post.content.substring(0, 100) + '...',
          scheduledFor: post.scheduledFor,
          overdueBy: Math.floor((now.getTime() - post.scheduledFor.getTime()) / (1000 * 60)) + ' minutes',
          userEmail: post.userId.email,
          linkedinConnected: !!linkedinDetails?.accessToken,
          accessTokenExpired: linkedinDetails?.accessTokenExpires ? 
            new Date(linkedinDetails.accessTokenExpires) < now : true,
          hasValidToken: linkedinDetails?.accessToken && 
            (!linkedinDetails.accessTokenExpires || new Date(linkedinDetails.accessTokenExpires) > now),
          possibleIssues: []
        }
      })
    )

    // Add possible issues
    analysis.forEach(item => {
      if (!item.linkedinConnected) {
        item.possibleIssues.push('LinkedIn not connected')
      }
      if (item.accessTokenExpired) {
        item.possibleIssues.push('LinkedIn access token expired')
      }
      if (item.overdueBy.includes('-')) {
        item.possibleIssues.push('Post scheduled in the future')
      }
    })

    return NextResponse.json({
      success: true,
      overduePostsAnalysis: analysis,
      totalOverdue: overduePosts.length,
      currentTime: now
    })
  } catch (error: any) {
    console.error("Analyze overdue posts error:", error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
