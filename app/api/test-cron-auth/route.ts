import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    console.log("🧪 Testing cron job authentication")
    
    // Check for auth header or query param
    const authHeader = req.headers.get('authorization')
    const authQuery = new URL(req.url).searchParams.get('auth')
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret'
    
    console.log("🔍 Auth details:", {
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader,
      hasAuthQuery: !!authQuery,
      authQueryValue: authQuery,
      expectedSecret: cronSecret,
      expectedHeader: `Bearer ${cronSecret}`,
      url: req.url,
      allHeaders: Object.fromEntries(req.headers.entries())
    })
    
    // Check authentication
    const isAuthenticated = authHeader === `Bearer ${cronSecret}` || authQuery === cronSecret
    const isDevMode = process.env.NODE_ENV === 'development' || !process.env.CRON_SECRET
    
    return NextResponse.json({
      success: true,
      message: "Cron job authentication test",
      authentication: {
        isAuthenticated,
        isDevMode,
        hasAuthHeader: !!authHeader,
        hasAuthQuery: !!authQuery,
        authHeaderValue: authHeader,
        authQueryValue: authQuery,
        expectedSecret: cronSecret,
        expectedHeader: `Bearer ${cronSecret}`,
        cronSecretSet: !!process.env.CRON_SECRET
      },
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error("Auth test error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
