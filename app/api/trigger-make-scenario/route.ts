import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import UserProfile from "../../../models/UserProfile"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await req.json()

    await connectDB()

    // Get user profile
    const userProfile = await UserProfile.findOne({
      email: session.user.email,
    })

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Prepare data for Make.com
    const makeData = {
      userId: userProfile.email,
      name: userProfile.name,
      email: userProfile.email,
      profileData: {
        mcqResponses: userProfile.mcqResponses,
        audioResponses: userProfile.audioResponses,
        niche: userProfile.niche,
        targetAudience: userProfile.targetAudience,
        contentTone: userProfile.contentTone,
        preferredPlatforms: userProfile.preferredPlatforms,
      },
      timestamp: new Date().toISOString(),
      source: "linkzup-dashboard",
    }

    console.log("🚀 Triggering Make.com scenario for user:", userProfile.email)

    // Send to Make.com webhook
    const makeResponse = await fetch(process.env.MAKE_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-api-key": process.env.MAKE_API_KEY!,
      },
      body: JSON.stringify(makeData),
    })

    if (!makeResponse.ok) {
      console.error("Make.com webhook failed:", makeResponse.status, makeResponse.statusText)
      throw new Error(`Make.com webhook failed: ${makeResponse.status}`)
    }

    console.log("✅ Make.com scenario triggered successfully")

    return NextResponse.json({
      success: true,
      message: "Content generation started",
      userId: userProfile.email,
    })
  } catch (error: any) {
    console.error("❌ Error triggering Make.com scenario:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to trigger scenario",
      },
      { status: 500 },
    )
  }
}
