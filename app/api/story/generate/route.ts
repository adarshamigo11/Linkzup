import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkSubscriptionAccess } from "@/lib/subscription-middleware"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"
import UserProfile from "@/models/UserProfile"

export async function POST(request: Request) {
  try {
    // Check subscription access for story generation
    const subscriptionCheck = await checkSubscriptionAccess(false)
    
    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { baseStoryData, customizationData } = await request.json()

    if (!baseStoryData || !customizationData) {
      return NextResponse.json({ error: "Base story data and customization data are required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user profile for context
    const profile = await UserProfile.findOne({ userId: user._id })

    console.log("🎯 Generating story for user:", user._id)
    console.log("👤 Profile context:", profile ? "Found" : "Not found")

    // Generate story using Make.com webhook
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 })
    }

    const webhookData = {
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      userIndustry: user.industry || "general",
      baseStoryData: baseStoryData,
      customizationData: customizationData,
      profileContext: profile ? {
        experience: profile.experience,
        expertise: profile.expertise,
        goals: profile.goals,
        targetAudience: profile.targetAudience
      } : null,
      generationType: "story",
      language: "English"
    }

    console.log("📤 Sending webhook data to Make.com:", {
      userId: webhookData.userId,
      userEmail: webhookData.userEmail,
      hasProfile: !!webhookData.profileContext
    })

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-api-key": process.env.MAKE_API_KEY || "",
      },
      body: JSON.stringify(webhookData),
    })

    if (!webhookResponse.ok) {
      console.error("❌ Webhook failed:", webhookResponse.status, webhookResponse.statusText)
      return NextResponse.json({ error: "Failed to generate story" }, { status: 500 })
    }

    console.log("✅ Webhook sent successfully")

    // Create a placeholder story to show that generation is in progress
    const placeholderStory = await GeneratedStory.create({
      userId: user._id,
      status: "generating",
      generatedStory: "Your story is being generated. This may take a few minutes.",
      baseStoryData: baseStoryData,
      customizationData: customizationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Story generation started. Your story will appear shortly.",
      storyId: placeholderStory._id,
      subscriptionInfo: subscriptionCheck.data
    })

  } catch (error) {
    console.error("❌ Error generating story:", error)
    return NextResponse.json({ 
      error: "Failed to generate story",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
