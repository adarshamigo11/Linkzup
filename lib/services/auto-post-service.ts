import connectDB from "@/lib/mongodb"
import ApprovedContent from "@/models/ApprovedContent"
import type { Db } from "mongodb"
import mongoose from "mongoose"
import { ISTTime } from "@/lib/utils/ist-time"

export interface AutoPostResult {
  success: boolean
  totalProcessed: number
  totalPosted: number
  totalFailed: number
  currentTime: string
  scheduledPosts: Array<{
    id: string
    title: string
    scheduledFor: string
    status: string
  }>
  results: Array<{
    postId: string
    title: string
    status: "posted" | "failed"
    error?: string
    linkedinUrl?: string
  }>
}

export class AutoPostService {
  private db: Db

  constructor(db: Db) {
    this.db = db
  }

  static async processScheduledPosts(): Promise<{ postsProcessed: number; errors: string[] }> {
    const errors: string[] = []
    let postsProcessed = 0

    try {
      await connectDB()

      console.log("🔍 Looking for scheduled posts at", ISTTime.getCurrentISTString())

      // Find all scheduled posts
      const scheduledPosts = await ApprovedContent.find({
        status: "scheduled",
        scheduledTime: { $exists: true, $ne: null },
      })

      console.log(`📋 Found ${scheduledPosts.length} scheduled posts`)

      for (const post of scheduledPosts) {
        try {
          const scheduledTime = new Date(post.scheduledTime)

          if (ISTTime.isTimeToPost(scheduledTime)) {
            console.log(`⏰ Time to post: ${post.topicTitle}`)

            // Post to LinkedIn
            const posted = await this.postToLinkedIn(post)

            if (posted) {
              // Update status to posted
              await ApprovedContent.findByIdAndUpdate(post._id, {
                status: "posted",
                postedAt: new Date(),
                scheduledTime: null,
              })

              postsProcessed++
              console.log(`✅ Successfully posted: ${post.topicTitle}`)
            } else {
              // Mark as failed
              await ApprovedContent.findByIdAndUpdate(post._id, {
                status: "failed",
                failedAt: new Date(),
              })

              errors.push(`Failed to post: ${post.topicTitle}`)
              console.log(`❌ Failed to post: ${post.topicTitle}`)
            }
          }
        } catch (error) {
          console.error(`❌ Error processing post ${post._id}:`, error)
          errors.push(`Error processing ${post.topicTitle}: ${error}`)
        }
      }

      return { postsProcessed, errors }
    } catch (error) {
      console.error("❌ Error in processScheduledPosts:", error)
      errors.push(`Database error: ${error}`)
      return { postsProcessed, errors }
    }
  }

  async processScheduledPosts(): Promise<AutoPostResult> {
    const currentTime = ISTTime.now()
    const collections = ["approvedcontents", "generatedcontents"]

    let totalProcessed = 0
    let totalPosted = 0
    let totalFailed = 0
    const results: AutoPostResult["results"] = []
    const scheduledPosts: AutoPostResult["scheduledPosts"] = []

    console.log(`🕐 Current IST Time: ${ISTTime.format(currentTime)}`)

    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName)

        // Find all scheduled posts
        const allScheduledPosts = await collection
          .find({
            $or: [{ status: "scheduled" }, { Status: "scheduled" }],
          })
          .toArray()

        console.log(`📊 Found ${allScheduledPosts.length} scheduled posts in ${collectionName}`)

        // Add to scheduled posts list for response
        allScheduledPosts.forEach((post) => {
          const scheduledTime = post.scheduledFor || post.scheduled_for || post.scheduledTime
          if (scheduledTime) {
            scheduledPosts.push({
              id: post._id.toString(),
              title: post.topicTitle || "Untitled",
              scheduledFor: ISTTime.format(new Date(scheduledTime)),
              status: post.status || post.Status,
            })
          }
        })

        // Find posts that are due for posting
        const duePosts = allScheduledPosts.filter((post) => {
          const scheduledTime = post.scheduledFor || post.scheduled_for || post.scheduledTime
          if (!scheduledTime) return false

          const isTimeToPost = ISTTime.isTimeToPost(new Date(scheduledTime))

          if (isTimeToPost) {
            console.log(`⏰ Post ${post._id} is due: ${ISTTime.format(new Date(scheduledTime))}`)
          }

          return isTimeToPost
        })

        console.log(`🎯 Found ${duePosts.length} posts due for posting in ${collectionName}`)

        // Process each due post
        for (const post of duePosts) {
          totalProcessed++

          try {
            const result = await this.postToLinkedIn(post, collection)

            if (result.success) {
              totalPosted++
              results.push({
                postId: post._id.toString(),
                title: post.topicTitle || "Untitled",
                status: "posted",
                linkedinUrl: result.linkedinUrl,
              })

              console.log(`✅ Successfully posted: ${post.topicTitle}`)
            } else {
              totalFailed++
              results.push({
                postId: post._id.toString(),
                title: post.topicTitle || "Untitled",
                status: "failed",
                error: result.error,
              })

              console.log(`❌ Failed to post: ${post.topicTitle} - ${result.error}`)
            }
          } catch (error) {
            totalFailed++
            const errorMessage = error instanceof Error ? error.message : String(error)

            results.push({
              postId: post._id.toString(),
              title: post.topicTitle || "Untitled",
              status: "failed",
              error: errorMessage,
            })

            // Update post status to failed
            await this.updatePostStatus(collection, post._id, "failed", errorMessage)

            console.log(`❌ Error processing post ${post._id}: ${errorMessage}`)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing collection ${collectionName}:`, error)
      }
    }

    return {
      success: true,
      totalProcessed,
      totalPosted,
      totalFailed,
      currentTime: ISTTime.format(currentTime),
      scheduledPosts,
      results,
    }
  }

  private static async postToLinkedIn(content: any): Promise<boolean> {
    try {
      // Get user's LinkedIn details
      const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/linkedin/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentId: content._id.toString(),
          userId: content.userId,
          content: content.content,
          imageUrl: content.imageUrl,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("❌ LinkedIn posting error:", error)
      return false
    }
  }

  private async postToLinkedIn(post: any, collection: any) {
    try {
      // Get user details
      const user = await this.findUser(post)
      if (!user) {
        await this.updatePostStatus(collection, post._id, "failed", "User not found")
        return { success: false, error: "User not found" }
      }

      // Validate LinkedIn connection
      if (!user.linkedinAccessToken || !user.linkedinTokenExpiry || new Date(user.linkedinTokenExpiry) <= new Date()) {
        await this.updatePostStatus(collection, post._id, "failed", "LinkedIn token expired")
        return { success: false, error: "LinkedIn token expired. Please reconnect LinkedIn." }
      }

      // Validate content
      const content = post.content || post.Content || ""
      if (!content.trim()) {
        await this.updatePostStatus(collection, post._id, "failed", "Empty content")
        return { success: false, error: "Empty content" }
      }

      // Prepare LinkedIn post
      const postBody: any = {
        author: `urn:li:person:${user.linkedinProfile?.id}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }

      // Handle image if present
      const imageUrl = post.imageUrl || post.Image || post.image_url
      if (imageUrl) {
        try {
          const imageAsset = await this.uploadImageToLinkedIn(
            imageUrl,
            user.linkedinAccessToken,
            user.linkedinProfile?.id,
          )

          postBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE"
          postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
            {
              status: "READY",
              description: { text: "Post Image" },
              media: imageAsset,
              title: { text: "Post Image" },
            },
          ]
        } catch (imageError) {
          console.log(`⚠️ Image upload failed, posting without image: ${imageError}`)
        }
      }

      // Post to LinkedIn
      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.linkedinAccessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postBody),
      })

      if (response.ok) {
        const linkedinData = await response.json()
        const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinData.id}/`

        // Update post as posted
        await collection.updateOne(
          { _id: post._id },
          {
            $set: {
              status: "posted",
              Status: "posted",
              postedAt: ISTTime.now(),
              posted_at: ISTTime.now(),
              linkedinPostId: linkedinData.id,
              linkedinUrl: linkedinUrl,
              updatedAt: ISTTime.now(),
              updated_at: ISTTime.now(),
            },
            $unset: {
              scheduledFor: 1,
              scheduled_for: 1,
              error: 1,
            },
          },
        )

        return { success: true, linkedinUrl }
      } else {
        const errorText = await response.text()
        await this.updatePostStatus(collection, post._id, "failed", `LinkedIn API error: ${errorText}`)
        return { success: false, error: `LinkedIn API error: ${errorText}` }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.updatePostStatus(collection, post._id, "failed", errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  private async findUser(post: any) {
    const usersCollection = this.db.collection("users")
    const userId = post.userId || post.user_id || post["User ID"] || post["user id"]

    let user = null

    // Try to find by user ID
    if (userId) {
      try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) })
        } else {
          user = await usersCollection.findOne({ _id: userId })
        }
      } catch (error) {
        console.log(`⚠️ Error finding user by ID: ${error}`)
      }
    }

    // Try to find by email
    if (!user && post.email) {
      user = await usersCollection.findOne({ email: post.email })
    }

    return user
  }

  private async updatePostStatus(collection: any, postId: any, status: string, error?: string) {
    const updateData: any = {
      status: status,
      Status: status,
      updatedAt: ISTTime.now(),
      updated_at: ISTTime.now(),
    }

    if (error) {
      updateData.error = error
      updateData.lastAttempt = ISTTime.now()
    }

    if (status === "failed") {
      // Remove scheduling when failed
      updateData.$unset = {
        scheduledFor: 1,
        scheduled_for: 1,
      }
    }

    await collection.updateOne({ _id: postId }, { $set: updateData })
  }

  private async uploadImageToLinkedIn(imageUrl: string, accessToken: string, linkedinPersonId: string) {
    // Register upload
    const registerResponse = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: `urn:li:person:${linkedinPersonId}`,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    })

    if (!registerResponse.ok) {
      throw new Error(`Failed to register upload: ${registerResponse.status}`)
    }

    const registerData = await registerResponse.json()

    // Download image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    // Upload image
    const uploadUrl =
      registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload image: ${uploadResponse.status}`)
    }

    return registerData.value.asset
  }
}
