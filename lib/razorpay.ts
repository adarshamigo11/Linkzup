import crypto from "crypto"

// Only import Razorpay on server side
let Razorpay: any = null
if (typeof window === "undefined") {
  try {
    Razorpay = require("razorpay")
  } catch (error) {
    console.warn("Razorpay package not found. Install with: npm install razorpay")
  }
}

export type PlanType = "zuper15" | "zuper30" | "zuper360"

export const PLANS = {
  zuper15: {
    id: "plan_R1zm8k3QMvJVFr", // Zuper 15 plan ID
    name: "Starter",
    displayName: "Starter",
    price: 900, // ₹9 in paise
    duration: "15 days",
    durationDays: 15,
    imageLimit: 7, // 7 images generation limit
    features: [
      "Profile Optimization",
      "Basic Content Strategy", 
      "Weekly Post Creation (2 posts)",
      "7 AI Image Generations",
      "Engagement Monitoring",
      "Basic Analytics Report",
      "Email Support",
    ],
  },
  zuper30: {
    id: "plan_R1zmTMBa8M14wR", // Zuper 30 plan ID
    name: "Most Popular",
    displayName: "Most Popular",
    price: 79900, // ₹799 in paise
    duration: "30 days",
    durationDays: 30,
    imageLimit: 15, // 15 images generation limit
    features: [
      "Everything in Starter",
      "Advanced Profile Optimization",
      "Weekly Post Creation (4 posts)",
      "15 AI Image Generations",
      "Network Growth Strategy",
      "Engagement Management",
      "Detailed Analytics Report",
      "Priority Email Support",
      "Monthly Strategy Call",
    ],
  },
  zuper360: {
    id: "plan_R1zmlMJx5RptpAZ", // Zuper 360 plan ID
    name: "Professional",
    displayName: "Professional",
    price: 599900, // ₹5,999 in paise
    duration: "360 days",
    durationDays: 360,
    imageLimit: 300, // 300 images generation limit
    features: [
      "Everything in Most Popular",
      "Premium Profile Optimization",
      "Weekly Post Creation (6 posts)",
      "300 AI Image Generations",
      "Advanced Network Growth",
      "Thought Leadership Strategy",
      "Competitor Analysis",
      "Custom Analytics Dashboard",
      "24/7 Priority Support",
      "Weekly Strategy Calls",
      "Content Calendar Management",
      "Annual Strategy Planning",
      "Priority Onboarding",
    ],
  },
} as const

// Create Razorpay instance only on server side with proper error handling
export function createRazorpayInstance() {
  if (typeof window !== "undefined") {
    throw new Error("Razorpay instance should only be created on server side")
  }

  if (!Razorpay) {
    throw new Error("Razorpay package not installed. Run: npm install razorpay")
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  console.log("🔍 Razorpay credentials check:", {
    hasKeyId: !!keyId,
    hasKeySecret: !!keySecret,
    keyIdLength: keyId?.length,
    keySecretLength: keySecret?.length,
    keyIdPrefix: keyId?.substring(0, 8),
  })

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.",
    )
  }

  try {
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    console.log("✅ Razorpay instance created successfully")
    return instance
  } catch (error) {
    console.error("❌ Failed to create Razorpay instance:", error)
    throw new Error("Failed to initialize Razorpay. Please check your credentials.")
  }
}

export function formatPrice(priceInPaise: number): string {
  return `₹${(priceInPaise / 100).toLocaleString("en-IN")}`
}

export function validatePlanType(planType: string): planType is PlanType {
  return planType in PLANS
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (typeof window !== "undefined") {
    throw new Error("Payment verification should only be done on server side")
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET not configured")
  }

  try {
    const body = orderId + "|" + paymentId
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(body.toString()).digest("hex")

    console.log("🔍 Signature verification:", {
      body,
      expectedSignature: expectedSignature.substring(0, 10) + "...",
      receivedSignature: signature.substring(0, 10) + "...",
      match: expectedSignature === signature,
    })

    return expectedSignature === signature
  } catch (error) {
    console.error("❌ Error verifying payment signature:", error)
    return false
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (typeof window !== "undefined") {
    throw new Error("Webhook verification should only be done on server side")
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET not configured - webhook verification disabled")
    return true // Allow webhooks to pass if secret is not configured (for development)
  }

  try {
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

    console.log("🔍 Webhook signature verification:", {
      expectedSignature: expectedSignature.substring(0, 10) + "...",
      receivedSignature: signature.substring(0, 10) + "...",
      match: expectedSignature === signature,
    })

    return expectedSignature === signature
  } catch (error) {
    console.error("❌ Error verifying webhook signature:", error)
    return false
  }
}

// Get Razorpay public key for frontend
export function getRazorpayPublicKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID not configured")
  }
  return publicKey
}

// Helper function to get plan by Razorpay plan ID
export function getPlanByRazorpayId(planId: string): { key: PlanType; plan: typeof PLANS[PlanType] } | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.id === planId) {
      return { key: key as PlanType, plan }
    }
  }
  return null
}

// Helper function to check if user has active subscription
export function isSubscriptionActive(subscriptionStatus: string, subscriptionExpiry: string | Date): boolean {
  if (subscriptionStatus !== "active") return false
  
  const expiryDate = new Date(subscriptionExpiry)
  const now = new Date()
  
  return expiryDate > now
}

// Helper function to get remaining image generations
export function getRemainingImageGenerations(
  subscriptionPlan: string,
  imagesGenerated: number = 0
): { limit: number; used: number; remaining: number } {
  const plan = PLANS[subscriptionPlan as PlanType]
  
  if (!plan) {
    return { limit: 0, used: 0, remaining: 0 }
  }
  
  return {
    limit: plan.imageLimit,
    used: imagesGenerated,
    remaining: Math.max(0, plan.imageLimit - imagesGenerated)
  }
}
