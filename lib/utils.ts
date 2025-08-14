import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Environment variable validation utility
export function validateEnvVars() {
  const requiredEnvVars = {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  }

  const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingEnvVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingEnvVars.join(', ')}`)
    return false
  }

  console.log('✅ All required environment variables are set')
  return true
}

// Safe database connection check
export function isDatabaseConfigured() {
  return !!process.env.MONGODB_URI
}

// Safe auth configuration check
export function isAuthConfigured() {
  return !!(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL)
}

// Utility function for consistent signout handling
export async function handleSignOut(router?: any) {
  try {
    // Clear any local storage or session storage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }

    // Sign out using NextAuth
    const { signOut } = await import('next-auth/react')
    await signOut({ 
      callbackUrl: "/signin",
      redirect: true 
    })
  } catch (error) {
    console.error("Signout error:", error)
    
    // Fallback: redirect manually if router is provided
    if (router) {
      router.push("/signin")
    } else if (typeof window !== 'undefined') {
      window.location.href = "/signin"
    }
  }
}

// Utility function to check if user is authenticated
export function isAuthenticated(session: any) {
  return session && session.user && session.user.email
}
