import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Content from "../../../../models/Content"
import Prompt from "../../../../models/Prompt"

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-make-api-key")

    if (apiKey !== process.env.MAKE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { promptId, userId, platform, makecomId, generatedContent } = await req.json()

    console.log("📥 Received content from Make.com:", {
      promptId,
      userId,
      platform,
      contentLength: generatedContent?.length,
    })

    await connectDB()

    // Parse the generated content into individual posts
    const posts = parseGeneratedContent(generatedContent)

    // Save each post to database
    const savedPosts = []
    for (const post of posts) {
      const content = await Content.create({
        prompt_id: promptId,
        user_id: userId,
        content: post.content,
        title: post.title,
        hashtags: post.hashtags,
        platform: platform,
        status: "pending",
        makecom_id: makecomId,
      })
      savedPosts.push(content)
    }

    // Update prompt status
    await Prompt.findByIdAndUpdate(promptId, { status: "used" })

    console.log(`✅ Saved ${savedPosts.length} posts to database`)

    return NextResponse.json({
      success: true,
      message: `${savedPosts.length} posts saved successfully`,
      posts: savedPosts.map((p) => ({
        id: p._id,
        title: p.title,
        status: p.status,
      })),
    })
  } catch (error: any) {
    console.error("❌ Error saving content from Make.com:", error)
    return NextResponse.json({ error: error.message || "Failed to save content" }, { status: 500 })
  }
}

function parseGeneratedContent(content: string) {
  const posts = []
  const postSections = content.split(/\[Post \d+\]/).filter((section) => section.trim())

  for (let i = 0; i < postSections.length; i++) {
    const postContent = postSections[i].trim()
    if (postContent) {
      // Extract hashtags
      const hashtagRegex = /#[\w\u0900-\u097F]+/g
      const hashtags = postContent.match(hashtagRegex) || []

      // Remove hashtags from content to get clean text
      const cleanContent = postContent.replace(hashtagRegex, "").trim()

      // Generate title from first line or first 50 characters
      const title = cleanContent.split("\n")[0].substring(0, 50) + "..."

      posts.push({
        title,
        content: postContent,
        hashtags: hashtags.map((tag) => tag.replace("#", "")),
      })
    }
  }

  return posts
}
