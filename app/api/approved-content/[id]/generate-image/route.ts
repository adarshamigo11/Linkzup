import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params
    const { isRegenerate = false } = await request.json()

    console.log("🎨 Generating image for approved content:", id)

    // Find the content first
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collection = mongoose.connection.db.collection("approvedcontents")
    const contentData = await collection.findOne({
      $and: [
        {
          $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id: id }, { ID: id }],
        },
        {
          $or: [
            { email: user.email },
            { "user id": user._id.toString() },
            { user_id: user._id.toString() },
            { userId: user._id.toString() },
            { userId: user._id },
          ],
        },
      ],
    })

    if (!contentData) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Delete old image from Cloudinary if regenerating
    if (isRegenerate && (contentData.imageUrl || contentData.Image)) {
      const oldImageUrl = contentData.imageUrl || contentData.Image
      try {
        const publicIdMatch = oldImageUrl.match(/\/v\d+\/(.+?)\./)
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = publicIdMatch[1]
          await cloudinary.uploader.destroy(publicId)
          console.log("🗑️ Old image deleted from Cloudinary:", publicId)
        }
      } catch (error) {
        console.warn("Warning: Could not delete old image from Cloudinary:", error)
      }
    }

    // Generate image prompt based on content
    const content = contentData.content || contentData.Content || ""
    const topicTitle = contentData.topicTitle || contentData.Topic || "Business Content"
    
    const imagePrompt = generateImagePrompt(content, topicTitle)
    console.log("🎯 Generated prompt:", imagePrompt)

    // Call OpenAI DALL-E API for image generation
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API error:", errorText)
      return NextResponse.json({ error: "Failed to generate image with AI" }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    const generatedImageUrl = openaiData.data[0].url

    // Upload to Cloudinary for permanent storage
    let permanentImageUrl: string
    try {
      const uploadResult = await cloudinary.uploader.upload(generatedImageUrl, {
        folder: "linkzup-approved-content",
        resource_type: "image",
        transformation: [
          { width: 1200, height: 630, crop: "fill", gravity: "center" },
          { quality: "auto", fetch_format: "auto" }
        ]
      })
      
      permanentImageUrl = uploadResult.secure_url
      console.log("✅ AI generated image uploaded to Cloudinary:", permanentImageUrl)
    } catch (cloudinaryError) {
      console.error("❌ Cloudinary upload error:", cloudinaryError)
      return NextResponse.json({ error: "Failed to save generated image" }, { status: 500 })
    }

    // Update the content with the new image URL
    const updateResult = await collection.updateOne(
      {
        $and: [
          {
            $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id: id }, { ID: id }],
          },
          {
            $or: [
              { email: user.email },
              { "user id": user._id.toString() },
              { user_id: user._id.toString() },
              { userId: user._id.toString() },
              { userId: user._id },
            ],
          },
        ],
      },
      {
        $set: {
          imageUrl: permanentImageUrl,
          Image: permanentImageUrl,
          imageGenerated: true,
          image_generated: true,
          aiGenerationUsed: true,
          ai_generation_used: true,
          updatedAt: new Date(),
          updated_at: new Date(),
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Content not found for update" }, { status: 404 })
    }

    console.log("✅ AI image generated and saved for content:", id)

    return NextResponse.json({
      success: true,
      imageUrl: permanentImageUrl,
      prompt: imagePrompt,
      isRegenerate,
      message: isRegenerate ? "Image regenerated successfully!" : "Image generated successfully!"
    })

  } catch (error: any) {
    console.error("❌ Error generating image:", error)
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

function generateImagePrompt(content: string, topicTitle: string): string {
  // Clean and extract key themes from content
  const cleanContent = content.replace(/[#@]/g, "").substring(0, 300)
  const cleanTitle = topicTitle.substring(0, 100)
  
  // Create a professional, LinkedIn-appropriate image prompt
  const basePrompt = `Create a professional, modern, and visually appealing image for LinkedIn business content. 
  
Topic: "${cleanTitle}"
Content theme: "${cleanContent}"

Style requirements:
- Professional and business-appropriate
- Clean, minimalist design
- Modern color palette (blues, whites, grays)
- No text overlays or words
- Suitable for social media sharing
- High quality and visually engaging
- Abstract or conceptual representation
- Corporate/business aesthetic`

  return basePrompt
}
