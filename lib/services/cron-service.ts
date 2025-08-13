import { ISTTime } from "@/lib/utils/ist-time"

export class CronService {
  private static instance: CronService
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  private constructor() {}

  static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService()
    }
    return CronService.instance
  }

  start(): void {
    if (this.isRunning) {
      console.log("🔄 Cron service is already running")
      return
    }

    console.log("🚀 Starting Cron Service at", ISTTime.getCurrentISTString())

    this.intervalId = setInterval(async () => {
      try {
        await this.checkAndPostScheduledContent()
      } catch (error) {
        console.error("❌ Cron job error:", error)
      }
    }, 60000) // Run every minute

    this.isRunning = true
    console.log("✅ Cron service started successfully")
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log("🛑 Cron service stopped")
  }

  isActive(): boolean {
    return this.isRunning
  }

  private async checkAndPostScheduledContent(): Promise<void> {
    try {
      console.log("🔍 Checking for scheduled content at", ISTTime.getCurrentISTString())

      const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/cron/auto-post`, {
        method: "GET",
        headers: {
          "User-Agent": "LinkZup-Cron/1.0",
          Authorization: `Bearer ${process.env.CRON_SECRET || "dev-cron-secret"}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.postsProcessed > 0) {
          console.log(`✅ Processed ${result.postsProcessed} scheduled posts`)
        }
      } else {
        console.error("❌ Cron API call failed:", response.status)
      }
    } catch (error) {
      console.error("❌ Error in cron check:", error)
    }
  }
}

// Auto-start in development
if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
  setTimeout(() => {
    const cronService = CronService.getInstance()
    cronService.start()
  }, 5000) // Start after 5 seconds
}
