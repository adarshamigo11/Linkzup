import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if the Make.com webhook URL is configured
    const webhookUrl = "https://hook.eu2.make.com/jtp66y459rkshrruo5vf5ii3ybm5gnyt"

    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        message: "Make.com webhook URL is not configured",
        status: "not_configured",
      })
    }

    // Send a test ping to the webhook
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: "This is a test ping from the LinkZup dashboard",
        }),
      })

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: "Make.com webhook is working correctly",
          status: "connected",
        })
      } else {
        return NextResponse.json({
          success: false,
          message: `Make.com webhook returned status ${response.status}`,
          status: "error",
          statusCode: response.status,
        })
      }
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: `Error connecting to Make.com webhook: ${error.message}`,
        status: "connection_error",
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Unexpected error: ${error.message}`,
      status: "error",
    })
  }
}
