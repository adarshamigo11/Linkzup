"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { toast } from "sonner"
import { Calendar, Clock, Send, Loader2 } from "lucide-react"
import { ISTTime } from "@/lib/utils/ist-time"

interface PostSchedulerProps {
  content: string
  imageUrl?: string
  contentId?: string
  onPostNow: () => Promise<void>
  onSchedulePost: (scheduledTime: Date) => Promise<void>
  disabled?: boolean
  postingNow?: boolean
  scheduling?: boolean
}

export function PostScheduler({
  content,
  imageUrl,
  contentId,
  onPostNow,
  onSchedulePost,
  disabled = false,
  postingNow = false,
  scheduling = false,
}: PostSchedulerProps) {
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>()
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)

  const handleSchedulePost = async () => {
    if (!scheduledTime) {
      toast.error("Please select a date and time")
      return
    }

    // Validate minimum time (5 minutes from now)
    const currentTime = new Date()
    const minTime = new Date(currentTime.getTime() + 5 * 60 * 1000) // 5 minutes from now
    
    if (scheduledTime.getTime() < minTime.getTime()) {
      toast.error("Scheduled time must be at least 5 minutes from now")
      return
    }

    try {
      await onSchedulePost(scheduledTime)
      setIsScheduleDialogOpen(false)
      setScheduledTime(undefined)
    } catch (error) {
      console.error("Error scheduling post:", error)
    }
  }

  const isContentValid = content && content.trim().length > 0

  return (
    <div className="flex gap-3 w-full">
      {/* Post Now Button */}
      <Button
        onClick={onPostNow}
        disabled={disabled || !isContentValid || postingNow || scheduling}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {postingNow ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Posting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Post Now
          </>
        )}
      </Button>

      {/* Schedule Post Button */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || !isContentValid || postingNow || scheduling}
            className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
          >
            {scheduling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Post
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Schedule LinkedIn Post
            </DialogTitle>
            <DialogDescription>
              Select when you want this post to be published. All times are in Indian Standard Time (IST).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Content Preview */}
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-2 font-medium">Content Preview:</p>
              <p className="text-sm text-gray-800 line-clamp-3">
                {content.substring(0, 150)}
                {content.length > 150 && "..."}
              </p>
              {imageUrl && <p className="text-xs text-blue-600 mt-2">📷 Image attached</p>}
            </div>

            {/* Date Time Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Date & Time (IST)</label>
              <DateTimePicker
                value={scheduledTime}
                onChange={setScheduledTime}
                placeholder="Choose date and time"
                minDate={new Date(Date.now() + 5 * 60 * 1000)}
              />
            </div>

            {/* Minimum Time Notice */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Posts must be scheduled at least 5 minutes from now. Current time:{" "}
                {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSchedulePost}
                disabled={!scheduledTime || scheduling}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
