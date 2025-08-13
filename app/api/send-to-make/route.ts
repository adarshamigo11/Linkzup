import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: Request) {
  try {
    // Check authentication and subscription
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById(session.user.id)
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check subscription status
    if (user.subscriptionStatus !== 'active') {
      return NextResponse.json({ 
        error: "Active subscription required for content generation",
        subscriptionStatus: user.subscriptionStatus 
      }, { status: 403 })
    }

    // Log the raw request
    console.log("📥 Received request to /api/send-to-make")
    
    // Parse the request body
    const body = await request.json()
    console.log("📦 Request body:", {
      hasTranscript: !!body.transcript,
      transcriptLength: body.transcript?.length,
      bodyKeys: Object.keys(body),
    })

    // Validate the request body
    if (!body || typeof body !== 'object') {
      console.error("❌ Invalid request body:", body)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    // Validate transcript
    if (!body.transcript || typeof body.transcript !== 'string') {
      console.error("❌ Missing or invalid transcript:", body)
      return NextResponse.json(
        { error: "Missing or invalid transcript" },
        { status: 400 }
      )
    }

    // Clean and validate the transcript
    const transcript = body.transcript.trim()
    if (!transcript) {
      console.error("❌ Empty transcript after trimming")
      return NextResponse.json(
        { error: "Transcript cannot be empty" },
        { status: 400 }
      )
    }

    // Prepare the data for content generation
    // Extract user info from the request body
    const userId = body.userId || body["User ID"] || body["User ID\t"];
    const email = body.email || body.Email;

    if (!userId || !email) {
      console.error("❌ Missing required user fields: User ID or Email", { userId, email });
      return NextResponse.json(
        { error: "Missing required user fields: User ID or Email" },
        { status: 400 }
      );
    }

    // Extract user requirements
    const userRequirements = body.userRequirements || {};

    // Use exact field names as required by Make.com webhook
    const makeData = {
      prompt: transcript,
      "User ID\t": userId,
      Email: email,
      contentLanguage: userRequirements.contentLanguage || "",
      targetAudience: userRequirements.targetAudience || "",
      contentTone: userRequirements.contentTone || "",
      contentLength: userRequirements.contentLength || "",
    };

    const webhookUrl = "https://hook.eu2.make.com/3sde0mx29gyqevlzh1vg9hcxntd9w1uq"
    console.log("📤 Sending for content generation:", {
      transcriptLength: transcript.length,
      makeData,
      webhookUrl,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      }
    })

    // Send to content generation webhook
    const makeResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(makeData),
    })

    // Log the response
    console.log("📥 Content generation response:", {
      status: makeResponse.status,
      statusText: makeResponse.statusText,
      headers: Object.fromEntries(makeResponse.headers.entries()),
    })

    if (!makeResponse.ok) {
      let errorMessage = `Content generation webhook failed: ${makeResponse.status}`
      let errorDetails = {}
      
      try {
        const responseText = await makeResponse.text()
        console.log("📥 Raw error response:", responseText)
        
        try {
          errorDetails = JSON.parse(responseText)
          console.error("❌ Error response (JSON):", errorDetails)
        } catch (e) {
          console.error("❌ Error response (text):", responseText)
          errorDetails = { message: responseText }
        }
      } catch (e) {
        console.error("❌ Failed to read error response:", e)
        errorDetails = { message: "Failed to read error response" }
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          status: makeResponse.status,
          statusText: makeResponse.statusText
        },
        { status: makeResponse.status }
      )
    }

    // Return success response
    return NextResponse.json({ 
      success: true,
      message: "Successfully sent for content generation",
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("❌ Error in /api/send-to-make:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}
