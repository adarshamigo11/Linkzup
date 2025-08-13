import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import ApprovedContent from "@/models/ApprovedContent"

export async function POST(req: Request) {
  try {
    // Verify Make.com webhook authentication
    const apiKey = req.headers.get("x-make-api-key")
    if (apiKey !== process.env.MAKE_API_KEY) {
      console.error("❌ Unauthorized webhook request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log("📥 Received webhook from Make.com:", {
      keys: Object.keys(body),
      hasContent: !!body.content || !!body.generated_content,
      hasUserId: !!body.userId || !!body.user_id,
      hasEmail: !!body.email,
    })

    await connectDB()

    // Extract data from webhook payload with multiple possible field names
    const {
      userId,
      user_id,
      email,
      topicId,
      topic_id,
      topicTitle,
      Topic,
      topic_title,
      content,
      generated_content,
      hashtags,
      keyPoints,
      key_points,
      contentType,
      content_type,
      imageUrl,
      image_url,
      platform,
      status,
      makeWebhookId,
      webhook_id,
    } = body

    // Find user by ID or email
    let user = null
    if (userId || user_id) {
      user = await User.findById(userId || user_id)
    }
    if (!user && email) {
      user = await User.findOne({ email })
    }

    if (!user) {
      console.error("❌ User not found:", { userId: userId || user_id, email })
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Extract and validate required fields
    const finalTopicTitle = topicTitle || Topic || topic_title || "Untitled Topic"
    const finalContent = content || generated_content || ""
    const finalTopicId = topicId || topic_id || `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (!finalContent || finalContent.trim().length === 0) {
      console.error("❌ Content is required but missing")
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Generate unique ID for this content
    const uniqueId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${user._id.toString().substr(-4)}`

    console.log("📝 Creating approved content:", {
      id: uniqueId,
      userId: user._id.toString(),
      topicTitle: finalTopicTitle,
      contentLength: finalContent.length,
      topicId: finalTopicId,
    })

    // Check if content with same topic and user already exists (prevent duplicates)
    const existingContent = await ApprovedContent.findOne({
      userId: user._id,
      topicId: finalTopicId,
      content: finalContent,
    })

    if (existingContent) {
      console.log("⚠️ Duplicate content detected, updating existing:", existingContent.id)

      // Update existing content instead of creating new
      existingContent.status = status || "generated"
      existingContent.updatedAt = new Date()
      if (makeWebhookId || webhook_id) {
        existingContent.makeWebhookId = makeWebhookId || webhook_id
      }

      await existingContent.save()

      return NextResponse.json({
        success: true,
        message: "Content updated successfully",
        contentId: existingContent.id,
        action: "updated",
      })
    }

    // Create new approved content with guaranteed unique ID
    const newContent = new ApprovedContent({
      id: uniqueId,
      topicId: finalTopicId,
      userId: user._id,
      topicTitle: finalTopicTitle,
      content: finalContent,
      hashtags: Array.isArray(hashtags) ? hashtags : Array.isArray(key_points) ? [] : [],
      keyPoints: Array.isArray(keyPoints) ? keyPoints : Array.isArray(key_points) ? key_points : [],
      contentType: contentType || content_type || "storytelling",
      imageUrl: imageUrl || image_url || null,
      platform: platform || "linkedin",
      status: status || "generated",
      makeWebhookId: makeWebhookId || webhook_id || null,
    })

    // Save with error handling for duplicate key
    try {
      await newContent.save()
      console.log("✅ Successfully created approved content:", {
        id: newContent.id,
        topicId: newContent.topicId,
        userId: user._id.toString(),
      })
    } catch (saveError: any) {
      if (saveError.code === 11000) {
        // Duplicate key error - generate new ID and retry
        console.log("⚠️ Duplicate ID detected, generating new ID and retrying...")
        newContent.id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${user._id.toString().substr(-4)}-retry`
        await newContent.save()
        console.log("✅ Successfully created approved content with new ID:", newContent.id)
      } else {
        throw saveError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Content saved successfully",
      contentId: newContent.id,
      action: "created",
    })
  } catch (error: any) {
    console.error("❌ Error processing Make.com webhook:", error)

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return NextResponse.json(
        {
          error: "Duplicate content detected",
          details: "Content with this ID already exists",
          code: "DUPLICATE_CONTENT",
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

// GET method for webhook verification
export async function GET(req: Request) {
  return NextResponse.json({
    status: "active",
    message: "Make.com webhook endpoint is working",
    timestamp: new Date().toISOString(),
  })
}
