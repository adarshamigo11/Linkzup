import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"

// Helper function to upload image to LinkedIn
async function uploadImageToLinkedIn(imageUrl: string, accessToken: string, linkedinPersonId: string) {
  try {
    console.log("🖼️ Starting image upload to LinkedIn:", imageUrl)

    // Step 1: Register the image upload
    const registerUploadUrl = "https://api.linkedin.com/v2/assets?action=registerUpload"
    const registerUploadBody = {
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
    }

    const registerResponse = await fetch(registerUploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(registerUploadBody),
    })

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text()
      console.error("❌ Failed to register upload:", errorText)
      throw new Error(`Failed to register upload: ${registerResponse.status} ${errorText}`)
    }

    const registerData = await registerResponse.json()
    console.log("📝 Upload registered successfully")

    // Step 2: Download the image from the URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    console.log("📷 Image downloaded, size:", imageBuffer.byteLength)

    // Step 3: Upload the image to LinkedIn
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
      const errorText = await uploadResponse.text()
      console.error("❌ Failed to upload image:", errorText)
      throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`)
    }

    console.log("✅ Image uploaded successfully to LinkedIn")
    return registerData.value.asset
  } catch (error) {
    console.error("❌ Error uploading image to LinkedIn:", error)
    throw error
  }
}

// Helper function to post to LinkedIn
async function postToLinkedIn(scheduledPost: any, user: any) {
  try {
    console.log("📤 Posting scheduled content to LinkedIn:", {
      postId: scheduledPost._id,
      contentLength: scheduledPost.content.length,
      hasImage: !!scheduledPost.imageUrl,
      linkedinId: user.linkedinProfile?.id,
    })

    // Prepare LinkedIn post data
    const LINKEDIN_UGC_POST_URL = "https://api.linkedin.com/v2/ugcPosts"

    const postBody: any = {
      author: `urn:li:person:${user.linkedinProfile?.id}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: scheduledPost.content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    // If there's an image, upload it to LinkedIn first
    if (scheduledPost.imageUrl) {
      try {
        console.log("📷 Scheduled post has image, uploading to LinkedIn:", scheduledPost.imageUrl)

        // Upload image to LinkedIn
        const imageAsset = await uploadImageToLinkedIn(
          scheduledPost.imageUrl,
          user.linkedinAccessToken!,
          user.linkedinProfile?.id!,
        )

        // Update post body to include the image
        postBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE"
        postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
          {
            status: "READY",
            description: {
              text: "Scheduled LinkedIn Post Image",
            },
            media: imageAsset,
            title: {
              text: "Scheduled LinkedIn Post Image",
            },
          },
        ]

        console.log("✅ Image prepared for scheduled LinkedIn post")
      } catch (imageError) {
        console.error("❌ Error handling image for scheduled post:", imageError)
        // Continue with text-only post if image upload fails
        console.log("🔄 Falling back to text-only post for scheduled content")
      }
    }

    // Post to LinkedIn
    const response = await fetch(LINKEDIN_UGC_POST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.linkedinAccessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    })

    if (response.ok) {
      const linkedinResponse = await response.json()
      console.log("✅ Successfully posted scheduled content to LinkedIn:", linkedinResponse.id)

      // Generate LinkedIn post URL
      const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinResponse.id}/`

      return {
        success: true,
        linkedinPostId: linkedinResponse.id,
        linkedinUrl: linkedinUrl,
        linkedinResponse: linkedinResponse,
      }
    } else {
      const errorData = await response.text()
      console.error("❌ Failed to post scheduled content to LinkedIn:", response.status, errorData)

      return {
        success: false,
        error: `LinkedIn posting failed: ${response.status} ${response.statusText}`,
        details: errorData,
      }
    }
  } catch (error: any) {
    console.error("❌ Error posting scheduled content to LinkedIn:", error)
    return {
      success: false,
      error: error.message || "Failed to post scheduled content to LinkedIn",
    }
  }
}

export async function GET(req: Request) {
  try {
    // TEMPORARILY DISABLE AUTH FOR TESTING
    console.log("🔄 Starting scheduled posts cron job at", ISTTime.getCurrentISTString())
    console.log("⚠️ Authentication temporarily disabled for testing")

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()
    console.log("⏰ Current UTC time:", currentUTC.toISOString())

    // Find all pending scheduled posts that are due (including overdue ones)
    const dueScheduledPosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: currentUTC },
      attempts: { $lt: 3 }, // Don't retry more than 3 times
    }).sort({ scheduledTime: 1 })

    console.log(`📋 Found ${dueScheduledPosts.length} due scheduled posts`)

    // Also check for overdue posts that might have been missed
    const overduePosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: new Date(currentUTC.getTime() - 24 * 60 * 60 * 1000) }, // Posts due more than 24 hours ago
      attempts: { $lt: 3 },
    })

    if (overduePosts.length > 0) {
      console.log(`⚠️ Found ${overduePosts.length} overdue posts that need attention`)
    }

    if (dueScheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled posts due",
        postsProcessed: 0,
        overduePosts: overduePosts.length,
        currentTime: ISTTime.getCurrentISTString(),
        authStatus: "disabled-for-testing",
      })
    }

    let successCount = 0
    let failureCount = 0

    // Process each scheduled post
    for (const scheduledPost of dueScheduledPosts) {
      try {
        console.log(`🔄 Processing scheduled post ${scheduledPost._id} (scheduled for: ${scheduledPost.scheduledTime})`)

        // Get user with LinkedIn credentials
        const user = await User.findById(scheduledPost.userId).select(
          "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile",
        )

        if (!user) {
          console.error(`❌ User not found for scheduled post ${scheduledPost._id}`)
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: "User not found",
            attempts: scheduledPost.attempts + 1,
            lastAttempt: new Date(),
          })
          failureCount++
          continue
        }

        // Check LinkedIn connection
        if (
          !user.linkedinAccessToken ||
          !user.linkedinTokenExpiry ||
          new Date(user.linkedinTokenExpiry) <= new Date()
        ) {
          console.error(`❌ LinkedIn not connected or token expired for user ${user.email}`)
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: "LinkedIn account not connected or token expired",
            attempts: scheduledPost.attempts + 1,
            lastAttempt: new Date(),
          })
          failureCount++
          continue
        }

        // Update attempt count
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          attempts: scheduledPost.attempts + 1,
          lastAttempt: new Date(),
        })

        // Post to LinkedIn with retry logic for rate limiting
        let postResult: any = null
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          try {
            postResult = await postToLinkedIn(scheduledPost, user)
            break // Success, exit retry loop
          } catch (error: any) {
            retryCount++
            console.error(`❌ Attempt ${retryCount} failed for post ${scheduledPost._id}:`, error.message)
            
            if (error.message.includes('rate limit') || error.message.includes('429')) {
              if (retryCount < maxRetries) {
                console.log(`⏳ Rate limit hit, waiting ${retryCount * 30} seconds before retry...`)
                await new Promise(resolve => setTimeout(resolve, retryCount * 30000)) // Wait 30s, 60s, 90s
                continue
              }
            }
            
            // For non-rate-limit errors or max retries reached, break
            break
          }
        }

        if (postResult && postResult.success) {
          // Update scheduled post as posted
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "posted",
            linkedinPostId: postResult.linkedinPostId,
            linkedinUrl: postResult.linkedinUrl,
            postedAt: new Date(),
            error: null, // Clear any previous errors
          })

          console.log(`✅ Successfully posted scheduled content ${scheduledPost._id}`)
          successCount++
        } else {
          // Update scheduled post as failed
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: postResult?.error || "Failed to post after all retry attempts",
          })

          console.error(`❌ Failed to post scheduled content ${scheduledPost._id}:`, postResult?.error || "Unknown error")
          failureCount++
        }
      } catch (error: any) {
        console.error(`❌ Error processing scheduled post ${scheduledPost._id}:`, error)

        // Update scheduled post as failed
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          status: "failed",
          error: error.message || "Unknown error occurred",
          attempts: scheduledPost.attempts + 1,
          lastAttempt: new Date(),
        })

        failureCount++
      }
    }

    console.log(`✅ Cron job completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Processed ${dueScheduledPosts.length} scheduled posts`,
      postsProcessed: dueScheduledPosts.length,
      successCount,
      failureCount,
      overduePosts: overduePosts.length,
      currentTime: ISTTime.getCurrentISTString(),
      authStatus: "disabled-for-testing",
    })
  } catch (error: any) {
    console.error("❌ Cron job error:", error)
    return NextResponse.json({ error: error.message || "Cron job failed" }, { status: 500 })
  }
}
