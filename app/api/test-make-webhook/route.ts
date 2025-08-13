import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    console.log("🧪 Test Make.com webhook data format:")
    console.log("Topic:", body.topic)
    console.log("Base Story:", body["base story "])
    console.log("Customization:", body.customization)
    console.log("User ID:", body["user id"])
    console.log("Email:", body.email)
    console.log("Topic ID:", body.topicId)
    
    // Validate required fields
    const requiredFields = ["topic", "base story ", "customization", "user id", "email"]
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: "Missing required fields",
        missingFields,
        receivedData: body
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Data format is valid",
      receivedData: body
    })
    
  } catch (error) {
    console.error("Test webhook error:", error)
    return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 })
  }
}
