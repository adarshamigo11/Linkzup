"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FileText, Share2, Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { PostScheduler } from "@/components/post-scheduler"

interface ApprovedContent {
  _id: string
  topicTitle: string
  content: string
  imageUrl?: string
  status: "approved" | "posted" | "failed"
  createdAt: string
  postedAt?: string
  failedAt?: string
}

export default function ApprovedContentPage() {
  const { data: session } = useSession()
  const [content, setContent] = useState<ApprovedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [postingStates, setPostingStates] = useState<{ [key: string]: boolean }>({})
  const [schedulingStates, setSchedulingStates] = useState<{ [key: string]: boolean }>({})

  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/approved-content")
      if (response.ok) {
        const data = await response.json()
        setContent(data.content || [])
      } else {
        toast.error("Failed to load approved content")
      }
    } catch (error) {
      console.error("Error loading content:", error)
      toast.error("Failed to load content")
    } finally {
      setLoading(false)
    }
  }

  const postNow = async (contentId: string) => {
    try {
      setPostingStates((prev) => ({ ...prev, [contentId]: true }))

      const response = await fetch(`/api/approved-content/${contentId}/post`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Content posted to LinkedIn!")
        loadContent()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to post content")
      }
    } catch (error) {
      console.error("Error posting content:", error)
      toast.error("Failed to post content")
    } finally {
      setPostingStates((prev) => ({ ...prev, [contentId]: false }))
    }
  }

  const schedulePost = async (contentId: string, scheduledTime: Date) => {
    try {
      setSchedulingStates((prev) => ({ ...prev, [contentId]: true }))

      const contentItem = content.find((item) => item._id === contentId)
      if (!contentItem) {
        toast.error("Content not found")
        return
      }

      const response = await fetch("/api/scheduled-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: contentItem.content,
          imageUrl: contentItem.imageUrl,
          contentId: contentId,
          scheduledTimeIST: scheduledTime.getTime(), // Send as timestamp to avoid timezone confusion
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Post scheduled for ${data.scheduledPost.scheduledTimeDisplay}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to schedule post")
      }
    } catch (error) {
      console.error("Error scheduling post:", error)
      toast.error("Failed to schedule post")
    } finally {
      setSchedulingStates((prev) => ({ ...prev, [contentId]: false }))
    }
  }

  useEffect(() => {
    loadContent()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "posted":
        return "bg-purple-100 text-purple-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "posted":
        return <Share2 className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading approved content...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Approved Content</h1>
              <p className="text-gray-600">Manage and post your approved LinkedIn content</p>
            </div>
            <Button onClick={loadContent} variant="outline" className="flex items-center gap-2 bg-transparent">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        {content.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Approved Content</h3>
              <p className="text-gray-500">You don't have any approved content yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <Card
                key={item._id}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {item.topicTitle}
                    </CardTitle>
                    <Badge className={`${getStatusColor(item.status)} flex items-center gap-1`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    Created: {formatDateTime(item.createdAt)}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Content Preview */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-3">{item.content}</p>
                    </div>

                    {/* Image Preview */}
                    {item.imageUrl && (
                      <div className="relative">
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt="Content image"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Status Info */}
                    {item.status === "posted" && item.postedAt && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Posted: {formatDateTime(item.postedAt)}</span>
                        </div>
                      </div>
                    )}

                    {item.status === "failed" && item.failedAt && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Failed: {formatDateTime(item.failedAt)}</span>
                        </div>
                      </div>
                    )}

                    {/* Post Scheduler Component */}
                    {item.status === "approved" && (
                      <PostScheduler
                        content={item.content}
                        imageUrl={item.imageUrl}
                        contentId={item._id}
                        onPostNow={() => postNow(item._id)}
                        onSchedulePost={(scheduledTime) => schedulePost(item._id, scheduledTime)}
                        disabled={false}
                        postingNow={postingStates[item._id] || false}
                        scheduling={schedulingStates[item._id] || false}
                      />
                    )}

                    {item.status === "failed" && (
                      <Button size="sm" variant="outline" onClick={() => postNow(item._id)} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry Post
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
