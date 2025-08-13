import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkSubscriptionAccess } from "@/lib/subscription-middleware"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"

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

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("🎯 Creating simple story for user:", user._id)

    // Generate simple story using Make.com webhook
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 })
    }

    const webhookData = {
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      userIndustry: user.industry || "general",
      generationType: "simple-story",
      language: "English"
    }

    console.log("📤 Sending webhook data to Make.com:", {
      userId: webhookData.userId,
      userEmail: webhookData.userEmail
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
      return NextResponse.json({ error: "Failed to create story" }, { status: 500 })
    }

    console.log("✅ Webhook sent successfully")

    // Create a placeholder story to show that generation is in progress
    const placeholderStory = await GeneratedStory.create({
      userId: user._id,
      status: "generating",
      generatedStory: "Your simple story is being created. This may take a few minutes.",
      baseStoryData: {
        name: user.name || "User",
        industry: user.industry || "Professional",
        experience: "Professional experience"
      },
      customizationData: {
        target_audience: "professionals",
        content_tone: "professional",
        content_goal: "build authority"
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Simple story creation started. Your story will appear shortly.",
      story: {
        _id: placeholderStory._id,
        status: placeholderStory.status,
        generatedStory: placeholderStory.generatedStory,
        baseStoryData: placeholderStory.baseStoryData,
        customizationData: placeholderStory.customizationData,
        createdAt: placeholderStory.createdAt,
        updatedAt: placeholderStory.updatedAt,
      },
      subscriptionInfo: subscriptionCheck.data
    })

  } catch (error) {
    console.error("❌ Error creating simple story:", error)
    return NextResponse.json({ 
      error: "Failed to create story",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
