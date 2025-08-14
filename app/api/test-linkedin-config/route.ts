import { NextResponse } from "next/server"

export async function GET() {
  try {
    const config = {
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ? "✅ Set" : "❌ Missing",
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "❌ Not set",
      LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || "❌ Not set",
      NODE_ENV: process.env.NODE_ENV,
    }

    // Calculate what redirect URI would be used
    let calculatedRedirectUri = process.env.LINKEDIN_REDIRECT_URI
    if (!calculatedRedirectUri) {
      const baseUrl = process.env.NEXTAUTH_URL || "https://linkzup.vercel.app"
      calculatedRedirectUri = `${baseUrl}/api/auth/linkedin/callback`
    }

    return NextResponse.json({
      success: true,
      config,
      calculatedRedirectUri,
      message: "Check the calculatedRedirectUri and make sure it matches your LinkedIn app settings",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
