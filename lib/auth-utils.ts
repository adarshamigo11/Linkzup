import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"

export async function getSafeServerSession() {
  try {
    // Check if required environment variables are set
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn("⚠️ NEXTAUTH_SECRET not set, authentication will fail")
      return null
    }

    if (!process.env.MONGODB_URI) {
      console.warn("⚠️ MONGODB_URI not set, authentication will fail")
      return null
    }

    const session = await getServerSession(authOptions)
    return session
  } catch (error) {
    console.error("❌ Error getting server session:", error)
    return null
  }
}

export function requireAuth(session: any) {
  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }
  return session
}

export function safeGetUserEmail(session: any): string | null {
  return session?.user?.email || null
}
