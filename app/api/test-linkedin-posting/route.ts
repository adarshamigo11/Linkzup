import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import LinkedInDetails from "@/models/LinkedInDetails"
import { LinkedInService } from "@/lib/services/linkedin-service"

export async function GET() {
  try {
    await connectDB()

    // Get all LinkedIn connections
    const linkedinConnections = await LinkedInDetails.find({})
      .populate('userId', 'email name')

    const connections = linkedinConnections.map(conn => ({
      userId: conn.userId,
      userEmail: conn.userId.email,
      profileId: conn.profileId,
      hasAccessToken: !!conn.accessToken,
      accessTokenExpires: conn.accessTokenExpires,
      isExpired: conn.accessTokenExpires ? new Date(conn.accessTokenExpires) < new Date() : true
    }))

    return NextResponse.json({
      success: true,
      totalConnections: connections.length,
      validConnections: connections.filter(c => c.hasAccessToken && !c.isExpired).length,
      connections
    })

  } catch (error: any) {
    console.error("Test LinkedIn posting error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    await connectDB()

    // Find a user with valid LinkedIn connection
    const linkedinDetails = await LinkedInDetails.findOne({
      accessToken: { $exists: true, $ne: null }
    }).populate('userId', 'email name')

    if (!linkedinDetails) {
      return NextResponse.json({
        success: false,
        message: "No LinkedIn connections found"
      })
    }

    if (linkedinDetails.accessTokenExpires && new Date(linkedinDetails.accessTokenExpires) < new Date()) {
      return NextResponse.json({
        success: false,
        message: "LinkedIn access token expired",
        userEmail: linkedinDetails.userId.email,
        tokenExpires: linkedinDetails.accessTokenExpires
      })
    }

    // Test posting to LinkedIn
    const linkedinService = new LinkedInService()
    const testContent = "This is a test post from LinkzUp to verify LinkedIn integration is working correctly. 🚀"
    
    console.log("🧪 Testing LinkedIn posting for user:", linkedinDetails.userId.email)

    const result = await linkedinService.postToLinkedIn(
      testContent,
      undefined, // no image
      linkedinDetails.accessToken,
      linkedinDetails.profileId
    )

    return NextResponse.json({
      success: true,
      testResult: result,
      userEmail: linkedinDetails.userId.email,
      profileId: linkedinDetails.profileId
    })

  } catch (error: any) {
    console.error("Test LinkedIn posting error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
