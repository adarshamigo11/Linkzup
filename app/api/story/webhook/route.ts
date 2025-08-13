import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import GeneratedStory from "@/models/GeneratedStory"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log("🎯 Received Make.com webhook data:", JSON.stringify(data, null, 2))

    const { user_id, email, story_id, generated_story, generated_topics, status, error } = data

    if (!user_id && !story_id) {
      console.error("❌ Missing user_id or story_id in webhook data")
      return NextResponse.json({ error: "Missing user_id or story_id" }, { status: 400 })
    }

    await connectDB()

    // Find the story record by story_id or user_id
    let storyRecord
    if (story_id) {
      storyRecord = await GeneratedStory.findById(story_id)
    } else {
      storyRecord = await GeneratedStory.findOne({ userId: user_id }).sort({ createdAt: -1 })
    }

    if (!storyRecord) {
      console.log("📝 No story record found, creating new one")
      storyRecord = new GeneratedStory({
        userId: user_id,
        baseStoryData: {},
        customizationData: {},
        generatedStory: "",
        status: "generating",
      })
    }

    console.log("📝 Updating story record:", storyRecord._id.toString())

    if (error) {
      // Handle error from Make.com
      console.error("❌ Make.com returned error:", error)
      storyRecord.status = "failed"
      storyRecord.generatedStory = `Story generation failed: ${error}`
    } else if (generated_story) {
      // Handle successful story generation
      console.log("✅ Story generated successfully by Make.com")
      storyRecord.generatedStory = generated_story
      storyRecord.status = status || "generated"

      // Add generated topics if provided
      if (generated_topics && Array.isArray(generated_topics)) {
        console.log("📝 Adding generated topics:", generated_topics.length)
        storyRecord.generatedTopics = generated_topics.map((topic: string, index: number) => ({
          id: `topic-${Date.now()}-${index}`,
          title: topic,
          status: "pending",
        }))
      }
    }

    await storyRecord.save()
    console.log("💾 Story record saved successfully")

    return NextResponse.json({
      success: true,
      message: error ? "Story generation failed" : "Story saved successfully",
      storyId: storyRecord._id.toString(),
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
