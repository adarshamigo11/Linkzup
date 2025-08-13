"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PaymentHistory } from "@/components/payment-history"
import { PaymentModal } from "@/components/payment-modal"
import { CreditCard, Crown, Star, Zap, AlertCircle, CheckCircle, Clock, Loader2, RefreshCw, TrendingUp, Shield, Users, BarChart3, Sparkles, ArrowRight, Check, X, Info, Receipt, DollarSign, CalendarDays, Activity, TrendingDown, ZapIcon, Target, PieChart, FileText, Download, Eye, Repeat, Infinity } from 'lucide-react'
import { format, addDays, differenceInDays, subMonths } from "date-fns"
import { toast } from "sonner"

interface UserSubscription {
  subscriptionStatus: string
  subscriptionPlan: string
  subscriptionExpiry: string
  contentGenerated?: number
  imagesGenerated?: number
  razorpayCustomerId?: string
  razorpaySubscriptionId?: string
  subscriptionStartDate?: string
  autoRenew?: boolean
}

interface PaymentStatus {
  orderId?: string
  status: "pending" | "processing" | "completed" | "failed" | "none"
  amount?: number
  planName?: string
  timestamp?: string
  error?: string
}

const plans = {
  zuper15: {
    name: "Starter",
    displayName: "Starter",
    price: "₹9",
    originalPrice: "₹9",
    icon: <Star className="h-6 w-6" />,
    color: "from-blue-500 to-blue-600",
    badge: "Starter",
    duration: "15 days",
    durationDays: 15,
    imageLimit: 7,
    contentLimit: 30,
    features: [
      "Profile Optimization",
      "Basic Content Strategy",
      "Weekly Post Creation (2 posts)",
      "7 AI Image Generations",
      "30 AI Content Generations",
      "Engagement Monitoring",
      "Basic Analytics Report",
      "Email Support",
    ],
  },
  zuper30: {
    name: "Most Popular",
    displayName: "Most Popular",
    price: "₹799",
    originalPrice: "₹799",
    icon: <Zap className="h-6 w-6" />,
    color: "from-purple-500 to-purple-600",
    badge: "Most Popular",
    duration: "30 days",
    durationDays: 30,
    imageLimit: 15,
    contentLimit: 30,
    features: [
      "Everything in Starter",
      "Advanced Profile Optimization",
      "Weekly Post Creation (4 posts)",
      "15 AI Image Generations",
      "30 AI Content Generations",
      "Network Growth Strategy",
      "Engagement Management",
      "Detailed Analytics Report",
      "Priority Email Support",
      "Monthly Strategy Call",
    ],
  },
  zuper360: {
    name: "Professional",
    displayName: "Professional",
    price: "₹5,999",
    originalPrice: "₹5,999",
    icon: <Crown className="h-6 w-6" />,
    color: "from-orange-500 to-orange-600",
    badge: "Professional",
    duration: "360 days",
    durationDays: 360,
    imageLimit: 300,
    contentLimit: -1, // Unlimited
    features: [
      "Everything in Most Popular",
      "Premium Profile Optimization",
      "Weekly Post Creation (6 posts)",
      "300 AI Image Generations",
      "Unlimited AI Content Generations",
      "Advanced Network Growth",
      "Thought Leadership Strategy",
      "Competitor Analysis",
      "Custom Analytics Dashboard",
      "24/7 Priority Support",
      "Weekly Strategy Calls",
              "Content Management",
      "Annual Strategy Planning",
      "Priority Onboarding",
    ],
  },
}

export default function BillingPage() {
  const { data: session } = useSession()
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: "none" })
  const [isPolling, setIsPolling] = useState(false)
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<{
    type: "zuper15" | "zuper30" | "zuper360"
    details: typeof plans.zuper15
  } | null>(null)

  useEffect(() => {
    fetchUserSubscription()
  }, [])

  // Show alert with current plan info for debugging
  useEffect(() => {
    if (userSubscription) {
      console.log("🎯 CURRENT PLAN INFO:", {
        subscriptionPlan: userSubscription.subscriptionPlan,
        subscriptionStatus: userSubscription.subscriptionStatus,
        displayName: getDisplayPlanName(),
        isActive: userSubscription.subscriptionStatus === "active"
      })
      
      // Show alert if plan is active but not showing correctly
      if (userSubscription.subscriptionStatus === "active" && userSubscription.subscriptionPlan === "zuper15") {
        console.log("✅ User has active Starter plan - should show 'Starter'")
      }
    }
  }, [userSubscription])

  // Real-time payment status polling with retry limit
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (paymentStatus.status === "pending" || paymentStatus.status === "processing") {
      if (pollingAttempts < 20) { // Max 20 attempts (60 seconds)
        setIsPolling(true)
        interval = setInterval(() => {
          checkPaymentStatus()
        }, 3000) // Check every 3 seconds
      } else {
        // Stop polling after max attempts
        setPaymentStatus({ status: "failed", error: "Payment verification timeout" })
        setIsPolling(false)
        toast.error("Payment verification timeout. Please check your payment status manually.")
      }
    } else {
      setIsPolling(false)
      setPollingAttempts(0)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [paymentStatus.status, pollingAttempts])

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/check")
      if (response.ok) {
        const data = await response.json()
        setUserSubscription({
          subscriptionStatus: data.subscription.status || "free",
          subscriptionPlan: data.subscription.plan || "free",
          subscriptionExpiry: data.subscription.endDate,
          contentGenerated: data.usage?.contentGenerated || 0,
          imagesGenerated: data.usage?.imagesGenerated || 0,
          razorpayCustomerId: data.subscription.razorpayCustomerId,
          razorpaySubscriptionId: data.subscription.razorpaySubscriptionId,
          subscriptionStartDate: data.subscription.startDate,
          autoRenew: data.subscription.autoRenew || false,
        })
      }
    } catch (error) {
      console.error("Failed to fetch user subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!paymentStatus.orderId) return

    try {
      setPollingAttempts(prev => prev + 1)
      const response = await fetch(`/api/payments/status/${paymentStatus.orderId}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.status === "paid" || data.status === "completed") {
          setPaymentStatus({ status: "completed" })
          toast.success("Payment completed successfully!")
          fetchUserSubscription() // Refresh subscription data
          setIsPolling(false)
          setPollingAttempts(0)
        } else if (data.status === "failed" || data.status === "cancelled") {
          setPaymentStatus({ status: "failed", error: data.error || "Payment failed" })
          toast.error("Payment failed. Please try again.")
          setIsPolling(false)
          setPollingAttempts(0)
        } else {
          setPaymentStatus(prev => ({ ...prev, status: data.status }))
        }
      } else if (response.status === 404) {
        // Payment record not found, might be still processing
        console.log("Payment record not found, continuing to poll...")
      } else {
        console.error("Payment status check failed:", response.status)
      }
    } catch (error) {
      console.error("Failed to check payment status:", error)
    }
  }

  const handlePaymentStart = (planType: "zuper15" | "zuper30" | "zuper360") => {
    setPaymentStatus({
      status: "pending",
      planName: plans[planType].displayName,
      amount: parseInt(plans[planType].price.replace("₹", "")),
      timestamp: new Date().toISOString(),
    })
    setPollingAttempts(0)
  }

  const handlePaymentComplete = (orderId: string) => {
    setPaymentStatus(prev => ({
      ...prev,
      orderId,
      status: "processing"
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "cancelled":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <Clock className="h-4 w-4" />
      case "expired":
        return <X className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getPaymentStatusColor = (status: PaymentStatus["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPaymentStatusIcon = (status: PaymentStatus["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <X className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const warning = addDays(new Date(), 7) // 7 days warning
    return expiry <= warning
  }

  const getDaysUntilRenewal = (expiryDate: string) => {
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    return differenceInDays(expiry, today)
  }

  const handleUpgrade = (planType: "zuper15" | "zuper30" | "zuper360") => {
    setSelectedPlan({
      type: planType,
      details: plans[planType],
    })
    handlePaymentStart(planType)
  }

  const getContentLimitText = (planKey: string) => {
    const plan = plans[planKey as keyof typeof plans]
    if (!plan) return "No limit"
    return plan.contentLimit === -1 ? "Unlimited" : `${plan.contentLimit}`
  }

  const getRemainingContent = (planKey: string, used: number) => {
    const plan = plans[planKey as keyof typeof plans]
    if (!plan || plan.contentLimit === -1) return "Unlimited"
    const remaining = plan.contentLimit - used
    return Math.max(0, remaining)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your billing information...</p>
        </div>
      </div>
    )
  }

  const currentPlan = userSubscription?.subscriptionPlan && plans[userSubscription.subscriptionPlan as keyof typeof plans] 
    ? plans[userSubscription.subscriptionPlan as keyof typeof plans] 
    : null

  // Debug logging
  console.log("🔍 Billing Page Debug:", {
    userSubscription: userSubscription,
    subscriptionPlan: userSubscription?.subscriptionPlan,
    currentPlan: currentPlan,
    displayName: currentPlan?.displayName,
    isActive: userSubscription?.subscriptionStatus === "active"
  })

  // Force show Starter plan if user has zuper15 subscription
  const getDisplayPlanName = () => {
    if (userSubscription?.subscriptionPlan === "zuper15") {
      return "Starter"
    } else if (userSubscription?.subscriptionPlan === "zuper30") {
      return "Most Popular"
    } else if (userSubscription?.subscriptionPlan === "zuper360") {
      return "Professional"
    } else if (userSubscription?.subscriptionStatus === "active" && userSubscription?.subscriptionPlan) {
      return userSubscription.subscriptionPlan
    } else {
      return "Free"
    }
  }

  const daysUntilRenewal = userSubscription?.subscriptionExpiry 
    ? getDaysUntilRenewal(userSubscription.subscriptionExpiry) 
    : null

  const isActiveSubscription = userSubscription?.subscriptionStatus === "active"

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing details</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchUserSubscription}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Payment Status */}
      {(paymentStatus.status === "pending" || paymentStatus.status === "processing") && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <RefreshCw className={`h-5 w-5 mr-2 ${isPolling ? "animate-spin" : ""}`} />
              Payment in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={`${getPaymentStatusColor(paymentStatus.status)} border`}>
                  {getPaymentStatusIcon(paymentStatus.status)}
                  <span className="ml-1 capitalize">
                    {paymentStatus.status === "pending" ? "Initializing..." : "Processing Payment..."}
                  </span>
                </Badge>
                {paymentStatus.planName && (
                  <span className="text-blue-700 font-medium">
                    {paymentStatus.planName} Plan - ₹{paymentStatus.amount}
                  </span>
                )}
              </div>
              {paymentStatus.timestamp && (
                <div className="text-sm text-blue-600">
                  Started at {format(new Date(paymentStatus.timestamp), "HH:mm:ss")}
                </div>
              )}
            </div>
            {paymentStatus.status === "processing" && (
              <div className="mt-3 text-sm text-blue-700">
                Please complete the payment in the popup window. This may take a few moments...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Failed Status */}
      {paymentStatus.status === "failed" && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <AlertCircle className="h-5 w-5 mr-2" />
              Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={`${getPaymentStatusColor(paymentStatus.status)} border`}>
                  {getPaymentStatusIcon(paymentStatus.status)}
                  <span className="ml-1">Payment Failed</span>
                </Badge>
                {paymentStatus.error && (
                  <span className="text-red-700 text-sm">{paymentStatus.error}</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaymentStatus({ status: "none" })}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current User's Subscription Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Plan Status */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{getDisplayPlanName()}</div>
            <p className="text-xs text-blue-600 mt-1">
              {isActiveSubscription ? "Active" : "Inactive"}
            </p>
            <div className="mt-2">
              <Badge className={`${getStatusColor(userSubscription?.subscriptionStatus || "free")} border text-xs`}>
                {getStatusIcon(userSubscription?.subscriptionStatus || "free")}
                <span className="ml-1">
                  {(userSubscription?.subscriptionStatus?.charAt(0)?.toUpperCase() || "") +
                    (userSubscription?.subscriptionStatus?.slice(1) || "") || "Free"}
                </span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Content Generated */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Content Generated</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{userSubscription?.contentGenerated || 0}</div>
            <p className="text-xs text-emerald-600 mt-1">
              {currentPlan ? `${getRemainingContent(userSubscription?.subscriptionPlan || "", userSubscription?.contentGenerated || 0)} remaining` : "No limit"}
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-xs text-emerald-600">AI-powered content</span>
            </div>
          </CardContent>
        </Card>

        {/* Images Generated */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Images Generated</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{userSubscription?.imagesGenerated || 0}</div>
            <p className="text-xs text-purple-600 mt-1">
              {currentPlan ? `${currentPlan.imageLimit - (userSubscription?.imagesGenerated || 0)} remaining` : "No limit"}
            </p>
            <div className="flex items-center mt-2">
              <CheckCircle className="h-3 w-3 text-purple-600 mr-1" />
              <span className="text-xs text-purple-600">AI-generated images</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Billing */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Next Billing</CardTitle>
            <CalendarDays className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {daysUntilRenewal !== null && daysUntilRenewal > 0 ? `${daysUntilRenewal}d` : "N/A"}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {userSubscription?.subscriptionExpiry ? format(new Date(userSubscription.subscriptionExpiry), "MMM dd, yyyy") : "No active plan"}
            </p>
            {isExpiringSoon(userSubscription?.subscriptionExpiry || "") && (
              <div className="flex items-center mt-2">
                <AlertCircle className="h-3 w-3 text-orange-600 mr-1" />
                <span className="text-xs text-orange-600">Expiring soon</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Current Subscription Details */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Target className="h-5 w-5 mr-2" />
                Your Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${currentPlan?.color || "from-gray-500 to-gray-600"} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                    {currentPlan?.icon || <Star className="h-8 w-8" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">
                      {getDisplayPlanName()} Plan
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {isActiveSubscription ? "Active subscription" : "No active subscription"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{currentPlan?.price || "₹0"}</div>
                  <div className="text-sm text-gray-600">per {currentPlan?.duration || "month"}</div>
                </div>
              </div>

              {/* Plan Limits */}
              {currentPlan && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <span className="text-sm font-semibold text-gray-700">Image Generations</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {userSubscription?.imagesGenerated || 0} / {currentPlan.imageLimit}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {currentPlan.imageLimit - (userSubscription?.imagesGenerated || 0)} remaining
                    </div>
                  </div>

                  <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-semibold text-gray-700">Content Generations</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {userSubscription?.contentGenerated || 0} / {getContentLimitText(userSubscription?.subscriptionPlan || "")}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {getRemainingContent(userSubscription?.subscriptionPlan || "", userSubscription?.contentGenerated || 0)} remaining
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Timeline */}
              {userSubscription?.subscriptionStartDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <CalendarDays className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Started On</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {format(new Date(userSubscription.subscriptionStartDate), "MMM dd, yyyy")}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {format(new Date(userSubscription.subscriptionStartDate), "HH:mm")}
                    </div>
                  </div>

                  <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Repeat className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Auto Renew</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${userSubscription?.autoRenew ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-gray-100 text-gray-800 border-gray-200"} border`}>
                        {userSubscription?.autoRenew ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Disabled
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Renewal Information */}
              {userSubscription?.subscriptionExpiry && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <CalendarDays className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Renewal Date</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {format(new Date(userSubscription.subscriptionExpiry), "MMM dd, yyyy")}
                    </div>
                    {daysUntilRenewal !== null && (
                      <div className="text-sm text-gray-600 mt-2">
                        {daysUntilRenewal > 0 ? `${daysUntilRenewal} days remaining` : "Expired"}
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <ZapIcon className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Status</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(userSubscription?.subscriptionStatus || "free")} border`}>
                        {getStatusIcon(userSubscription?.subscriptionStatus || "free")}
                        <span className="ml-1">
                          {(userSubscription?.subscriptionStatus?.charAt(0)?.toUpperCase() || "") +
                            (userSubscription?.subscriptionStatus?.slice(1) || "") || "Free"}
                        </span>
                      </Badge>
                      {isExpiringSoon(userSubscription.subscriptionExpiry) && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Features */}
              {currentPlan && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">Your Plan Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Free Plan Message */}
              {!currentPlan && (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Free Plan</h3>
                  <p className="text-gray-500 mb-4">
                    You&apos;re currently on the free plan. Upgrade to access premium features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <PaymentHistory />
        </div>

        {/* Available Plans Sidebar */}
        <div className="space-y-6">
          {/* Available Plans */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Available Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(plans).map(([key, plan]) => (
                <div key={key} className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                  userSubscription?.subscriptionPlan === key 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${plan.color} rounded-lg flex items-center justify-center text-white`}>
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.displayName}</h3>
                        <p className="text-sm text-gray-600">{plan.duration}</p>
                      </div>
                    </div>
                    <Badge variant={plan.badge === "Most Popular" ? "default" : "secondary"} className="text-xs">
                      {plan.badge}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900">{plan.price}</div>
                    <p className="text-sm text-gray-600">per {plan.duration}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Image Generations:</span>
                      <span className="font-medium">{plan.imageLimit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Content Posts:</span>
                      <span className="font-medium">{plan.contentLimit === -1 ? "Unlimited" : plan.contentLimit}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUpgrade(key as "zuper15" | "zuper30" | "zuper360")}
                    className={`w-full ${
                      userSubscription?.subscriptionPlan === key
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    }`}
                    disabled={userSubscription?.subscriptionPlan === key}
                  >
                    {userSubscription?.subscriptionPlan === key ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Choose Plan
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Billing History
              </Button>
              <Button variant="outline" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Payment Methods
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          planType={selectedPlan.type}
          onPaymentStart={handlePaymentStart}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  )
}
