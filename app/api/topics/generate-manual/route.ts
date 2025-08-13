import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkSubscriptionAccess } from "@/lib/subscription-middleware"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import GeneratedStory from "@/models/GeneratedStory"
import UserProfile from "@/models/UserProfile"
import mongoose from "mongoose"

export async function POST(request: Request) {
  try {
    // Check subscription access for topic generation
    const subscriptionCheck = await checkSubscriptionAccess(false)
    
    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt } = await request.json()
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check monthly topic limit
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const currentTopicCount = await Topic.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    })

    if (currentTopicCount >= 30) {
      return NextResponse.json(
        {
          error:
            "You have reached the maximum limit of 30 topics this month. Please wait for next month or dismiss some topics.",
          currentCount: currentTopicCount,
          maxLimit: 30,
        },
        { status: 400 },
      )
    }

    // Get user's latest story and profile for context
    const story = await GeneratedStory.findOne({ userId: user._id }).sort({ createdAt: -1 })
    const profile = await UserProfile.findOne({ userId: user._id })

    console.log("🎯 Generating manual topics for user:", user._id)
    console.log("📝 User prompt:", prompt)
    console.log("📖 Story context:", story ? "Found" : "Not found")
    console.log("👤 Profile context:", profile ? "Found" : "Not found")

    // Generate topics using Make.com webhook
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 })
    }

    const webhookData = {
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      userIndustry: user.industry || "general",
      userPrompt: prompt,
      storyContext: story?.generatedStory || "",
      profileContext: profile ? {
        experience: profile.experience,
        expertise: profile.expertise,
        goals: profile.goals,
        targetAudience: profile.targetAudience
      } : null,
      generationType: "manual",
      count: 5,
      language: "English"
    }

    console.log("📤 Sending webhook data to Make.com:", {
      userId: webhookData.userId,
      userEmail: webhookData.userEmail,
      hasStory: !!webhookData.storyContext,
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
      return NextResponse.json({ error: "Failed to generate topics" }, { status: 500 })
    }

    console.log("✅ Webhook sent successfully")

    // Create a placeholder topic to show that generation is in progress
    const placeholderTopic = await Topic.create({
      userId: user._id,
      title: "Generating topics...",
      description: "Your topics are being generated based on your prompt. This may take a few minutes.",
      category: "manual",
      difficulty: "medium",
      estimatedTime: "5-10 minutes",
      tags: ["manual-generated"],
      language: "English",
      status: "pending",
      generationType: "manual",
      userPrompt: prompt,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Topic generation started. Topics will appear shortly.",
      topicId: placeholderTopic._id,
      subscriptionInfo: subscriptionCheck.data
    })

  } catch (error) {
    console.error("❌ Error generating manual topics:", error)
    return NextResponse.json({ 
      error: "Failed to generate topics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
