import { NextResponse } from "next/server"
import { validateEnvVars, isDatabaseConfigured, isAuthConfigured } from "@/lib/utils"

export async function GET() {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: {
        MONGODB_URI: isDatabaseConfigured() ? "configured" : "missing",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "configured" : "missing",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "configured" : "missing",
      },
      checks: {
        envVarsValid: validateEnvVars(),
        databaseConfigured: isDatabaseConfigured(),
        authConfigured: isAuthConfigured(),
      }
    }

    const statusCode = health.checks.envVarsValid ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    )
  }
}
