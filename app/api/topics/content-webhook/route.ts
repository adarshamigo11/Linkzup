import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Topic from "@/models/Topic"
import User from "@/models/User"
import ApprovedContent from "@/models/ApprovedContent"

export async function POST(req: Request) {
  try {
    // Verify API key for security
    const apiKey = req.headers.get("x-make-api-key")
    if (apiKey !== process.env.MAKE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log("📥 Received content from Make.com for topic:", {
      topicId: body.topicId,
      contentLength: body.content?.length,
      status: body.status
    })

    const { 
      topicId, 
      content, 
      hashtags, 
      keyPoints, 
      imageUrl, 
      status = "generated",
      error,
      id,
      Topic,
      email
    } = body

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    await connectDB()

    // Find the topic
    const topic = await Topic.findOne({ id: topicId })
    if (!topic) {
      console.error("❌ Topic not found:", topicId)
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Update topic with generated content
    if (error) {
      topic.contentStatus = "failed"
      topic.content = `Error generating content: ${error}`
      console.error("❌ Content generation failed for topic:", topicId, error)
    } else {
      topic.content = content || ""
      topic.contentStatus = "generated" // Always set to generated when successful
      topic.contentGeneratedAt = new Date()
      
      // Generate unique content ID for this topic
      const contentId = `content-${topicId}-${Date.now()}`
      topic.contentId = contentId
      
      // Store additional metadata
      if (hashtags) topic.hashtags = hashtags
      if (keyPoints) topic.keyPoints = keyPoints
      if (imageUrl) topic.imageUrl = imageUrl
      
      console.log("✅ Content generated successfully for topic:", topicId)
      
      // Save to ApprovedContent table
      try {
        // Generate a unique ID if none provided or if it's null
        const uniqueId = id && id !== null ? id : `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Use the content ID from topic to prevent duplicates
        const contentId = `content-${topicId}-${Date.now()}`
        
        // Check if content already exists for this topic
        const existingContent = await ApprovedContent.findOne({ 
          topicId: topicId,
          userId: topic.userId 
        })
        
        if (existingContent) {
          console.log("⚠️ Content already exists for this topic, updating instead")
          existingContent.content = content || "generated content" || ""
          existingContent.topicTitle = Topic || topic.title || "Generated Content"
          existingContent.hashtags = hashtags || []
          existingContent.keyPoints = keyPoints || []
          existingContent.imageUrl = imageUrl || ""
          existingContent.status = "generated"
          existingContent.updatedAt = new Date()
          await existingContent.save()
          console.log("✅ Content updated in ApprovedContent table:", existingContent.id)
        } else {
          const approvedContent = new ApprovedContent({
            id: contentId, // Use the same content ID as topic
            topicId: topicId || `topic-${Date.now()}`,
            userId: topic.userId,
            topicTitle: Topic || topic.title || "Generated Content",
            content: content || "generated content" || "",
            hashtags: hashtags || [],
            keyPoints: keyPoints || [],
            imageUrl: imageUrl || "",
            platform: "linkedin",
            status: "generated",
            makeWebhookId: topic.makeWebhookId || "",
            generatedAt: new Date(),
          })
          
          await approvedContent.save()
          console.log("✅ Content saved to ApprovedContent table:", approvedContent.id)
        }
      } catch (saveError) {
        console.error("❌ Error saving to ApprovedContent table:", saveError)
        console.error("❌ Save error details:", {
          id: id,
          topicId: topicId,
          content: content ? content.substring(0, 100) + "..." : "empty",
          error: saveError
        })
      }
    }

    await topic.save()

    return NextResponse.json({
      success: true,
      message: "Topic content updated successfully",
      topicId: topic.id,
      status: topic.contentStatus
    })

  } catch (error: any) {
    console.error("❌ Error processing topic content webhook:", error)
    return NextResponse.json({ 
      error: "Failed to process webhook",
      details: error.message 
    }, { status: 500 })
  }
}
