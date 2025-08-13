import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    console.log("🚀 Sending audio file directly to Make.com webhook...")

    // Get the form data with the audio file
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Get the webhook URL
    const webhookUrl = "https://hook.eu2.make.com/8u1ev5fztudzogto5eheowsq3nxkk9ad"

    // Create a new FormData to send to Make.com
    const makeFormData = new FormData()

    // Add the audio file
    makeFormData.append("audio", audioFile)

    // Add metadata
    makeFormData.append("timestamp", new Date().toISOString())
    makeFormData.append("source", "linkzup-dashboard")
    makeFormData.append("fileSize", audioFile.size.toString())
    makeFormData.append("fileName", audioFile.name)
    makeFormData.append("fileType", audioFile.type)

    // Additional metadata from the request
    const metadata = formData.get("metadata")
    if (metadata) {
      makeFormData.append("metadata", metadata.toString())
    }

    console.log("📤 Sending to Make.com:", {
      url: webhookUrl,
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
    })

    // Send to Make.com webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: makeFormData,
    })

    console.log("📡 Make.com response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Make.com webhook error:", errorText)
      throw new Error(`Make.com webhook failed: ${response.status} - ${errorText}`)
    }

    // For testing purposes, simulate a response from Make.com
    const simulatedContent = {
      linkedinPost: `🚀 **Content Automation Insights**\n\nJust shared my thoughts on how AI-powered content workflows are transforming marketing teams!\n\nKey takeaways:\n✅ 70% reduction in content creation time\n✅ More consistent brand messaging\n✅ Higher quality engagement\n✅ Freedom to focus on strategy\n\nThe future of content isn't about replacing humans - it's about amplifying our creativity with smart automation.\n\nWhat content tasks are you automating in your workflow?\n\n#ContentAutomation #AIMarketing #ProductivityHacks`,
      twitterPost:
        "Just recorded my thoughts on content automation! 🎙️\n\nUsing AI tools can save marketing teams 15+ hours weekly while improving quality.\n\nThe key? Automate repetitive tasks, not creative thinking.\n\n#ContentAutomation #MarketingTips",
      facebookPost:
        "📣 Content Automation is changing how marketing teams work!\n\nIn my latest audio, I discuss how AI tools are helping teams save time while improving content quality. The most exciting part? You don't need to be technical to implement these solutions.\n\nHave you tried any content automation tools? What has your experience been like?",
      instagramCaption:
        "📱 Content automation isn't about replacing creativity - it's about amplifying it!\n\nIn this audio, I break down how modern marketing teams are saving 15+ hours per week while improving their content quality.\n\nWhat repetitive content tasks are slowing YOUR team down? Comment below! 👇\n\n#ContentAutomation #MarketingStrategy #ProductivityHacks #AITools",
      hashtags: [
        "ContentAutomation",
        "MarketingStrategy",
        "AITools",
        "ProductivityHacks",
        "ContentCreation",
        "DigitalMarketing",
      ],
      keyPoints: [
        "Content automation saves significant time",
        "Quality and consistency improve with the right tools",
        "Human creativity remains essential",
        "Teams can focus more on strategy",
        "Implementation doesn't require technical expertise",
      ],
    }

    const result = await response.text()
    console.log("✅ Successfully sent audio to Make.com")

    return NextResponse.json({
      success: true,
      message: "Audio file sent to Make.com successfully",
      makeResponse: result,
      generatedContent: simulatedContent, // This would normally come from Make.com's response
    })
  } catch (error: any) {
    console.error("❌ Error sending audio to Make.com:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to send audio to Make.com",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
