import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkSubscriptionAccess, incrementContentGeneration } from "@/lib/subscription-middleware"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"
import GeneratedStory from "@/models/GeneratedStory"
import UserProfile from "@/models/UserProfile"
import mongoose from "mongoose"

export async function POST(request: Request) {
  let topicId: string | null = null
  
  try {
    // Check subscription access for content generation
    const subscriptionCheck = await checkSubscriptionAccess(false)
    
    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestData = await request.json()
    topicId = requestData.topicId
    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check monthly content generation limit
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const currentContentCount = await ApprovedContent.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    })

    if (currentContentCount >= 30) {
      return NextResponse.json(
        {
          error: "You have reached the maximum limit of 30 content generations this month. Please wait for next month.",
          currentCount: currentContentCount,
          maxLimit: 30,
        },
        { status: 400 },
      )
    }

    // Find the topic
    const topic = await Topic.findOne({ id: topicId, userId: user._id })
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Check if content already exists for this topic
    if (topic.contentStatus === "generated") {
      return NextResponse.json({ error: "Content already generated for this topic" }, { status: 400 })
    }

    // Get user's story and profile for context
    const story = await GeneratedStory.findOne({ userId: user._id }).sort({ createdAt: -1 })
    const profile = await UserProfile.findOne({ userId: user._id })

    console.log("🎯 Generating content for topic:", topicId)
    console.log("📝 Topic title:", topic.title)
    console.log("📖 Story context:", story ? "Found" : "Not found")
    console.log("👤 Profile context:", profile ? "Found" : "Not found")

    // Generate content using Make.com webhook
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 })
    }

    const webhookData = {
      "base story ": `Generate a LinkedIn post for a user with the following context:
Topic: ${topic.title}
${topic.description ? `Description: ${topic.description}` : ''}
${story?.generatedStory ? `Story Context: ${story.generatedStory}` : ''}
${profile ? `User Profile: Experience - ${profile.experience}, Expertise - ${profile.expertise}, Goals - ${profile.goals}, Target Audience - ${profile.targetAudience}` : ''}
Industry: ${user.industry || "general"}
User Name: ${user.name}`,
      "cutomization": "professional and engaging tone, 200-300 words, include relevant hashtags",
      "user id": user._id.toString(),
      "email": user.email
    }

    console.log("📤 Sending webhook data to Make.com:", {
      topicId: topicId,
      userId: webhookData["user id"],
      userEmail: webhookData.email,
      hasStory: !!story?.generatedStory,
      hasProfile: !!profile
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
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
    }

    console.log("✅ Webhook sent successfully")

    // Update topic status to generating
    await Topic.updateOne(
      { id: topicId },
      { 
        $set: { 
          contentStatus: "generating",
          updatedAt: new Date()
        } 
      }
    )

    // Increment content generation count
    await incrementContentGeneration(session.user.email)

    return NextResponse.json({
      success: true,
      message: "Content generation started. Content will appear shortly.",
      topicId: topicId,
      subscriptionInfo: subscriptionCheck.data
    })

  } catch (error) {
    console.error("❌ Error generating content:", error)
    
    // Reset topic status if there was an error
    if (topicId) {
      try {
        await Topic.updateOne(
          { id: topicId },
          { 
            $set: { 
              contentStatus: "not_generated",
              updatedAt: new Date()
            } 
          }
        )
      } catch (resetError) {
        console.error("Failed to reset topic status:", resetError)
      }
    }
    
    return NextResponse.json({ 
      error: "Failed to generate content",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
