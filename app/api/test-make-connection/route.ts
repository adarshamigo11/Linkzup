import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const testData = {
      topic: "Test Topic",
      "base story ": "This is a test base story for verification",
      customization: JSON.stringify({
        target_audience: "professionals",
        content_tone: "professional",
        writing_style: "conversational",
        content_length: "medium",
        keywords: ["test", "verification"],
        content_goal: "engagement",
        engagement_style: "interactive",
        personal_anecdotes: "include",
        visual_style: "clean",
        branding_colors: "professional",
        content_inspiration: "industry trends",
        content_differentiation: "unique perspective",
      }),
      "user id": "test-user-123",
      email: "test@example.com",
      topicId: "test-topic-123",
      timestamp: new Date().toISOString(),
    }

    console.log("🧪 Testing Make.com webhook connection...")
    console.log("Test data:", testData)

    const makeWebhookUrl = "https://hook.eu2.make.com/j85vs5sh64vqruc1ifzbmp3lo1o61m1o"
    
    const makeResponse = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    })

    console.log("📤 Make.com response status:", makeResponse.status)
    console.log("📤 Make.com response headers:", Object.fromEntries(makeResponse.headers.entries()))

    let responseText = ""
    try {
      responseText = await makeResponse.text()
      console.log("📤 Make.com response body:", responseText)
    } catch (e) {
      console.log("📤 Could not read response body")
    }

    if (makeResponse.ok) {
      return NextResponse.json({
        success: true,
        message: "Make.com webhook connection successful",
        status: makeResponse.status,
        response: responseText
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Make.com webhook connection failed",
        status: makeResponse.status,
        response: responseText,
        testData: testData
      }, { status: makeResponse.status })
    }

  } catch (error) {
    console.error("❌ Test connection error:", error)
    return NextResponse.json({
      success: false,
      message: "Connection test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
