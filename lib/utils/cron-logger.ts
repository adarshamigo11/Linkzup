export class CronLogger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  info(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${this.context}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : "")
  }

  warn(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    console.warn(`[${timestamp}] [${this.context}] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : "")
  }

  error(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] [${this.context}] ERROR: ${message}`, data ? JSON.stringify(data, null, 2) : "")
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString()
      console.debug(`[${timestamp}] [${this.context}] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : "")
    }
  }
}
