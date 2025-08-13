import type { CronLogger } from "@/lib/utils/cron-logger"

export interface LinkedInPostResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
}

export class LinkedInService {
  private logger: CronLogger

  constructor(logger: CronLogger) {
    this.logger = logger
  }

  async postToLinkedIn(
    content: string,
    imageUrl?: string,
    accessToken?: string,
    linkedinPersonId?: string,
  ): Promise<LinkedInPostResult> {
    if (!accessToken || !linkedinPersonId) {
      return { success: false, error: "Missing LinkedIn credentials" }
    }

    try {
      this.logger.info("Posting to LinkedIn", {
        contentLength: content.length,
        hasImage: !!imageUrl,
        personId: linkedinPersonId,
      })

      // Prepare post body
      const postBody: any = {
        author: `urn:li:person:${linkedinPersonId}`,
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
      if (imageUrl) {
        try {
          const imageAsset = await this.uploadImageToLinkedIn(imageUrl, accessToken, linkedinPersonId)

          postBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE"
          postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
            {
              status: "READY",
              description: {
                text: "LinkedIn Post Image",
              },
              media: imageAsset,
              title: {
                text: "LinkedIn Post Image",
              },
            },
          ]

          this.logger.info("Image prepared for LinkedIn post")
        } catch (imageError) {
          this.logger.warn("Failed to upload image, posting without image", { error: imageError })
          // Continue with text-only post
        }
      }

      // Post to LinkedIn
      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postBody),
      })

      if (response.ok) {
        const data = await response.json()
        const linkedinUrl = `https://www.linkedin.com/feed/update/${data.id}/`

        this.logger.info("Successfully posted to LinkedIn", { postId: data.id })

        return {
          success: true,
          postId: data.id,
          url: linkedinUrl,
        }
      } else {
        const errorText = await response.text()
        this.logger.error("LinkedIn API error", { status: response.status, error: errorText })

        return {
          success: false,
          error: `LinkedIn API error (${response.status}): ${errorText}`,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error("Error posting to LinkedIn", { error: errorMessage })

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  private async uploadImageToLinkedIn(imageUrl: string, accessToken: string, linkedinPersonId: string) {
    this.logger.info("Uploading image to LinkedIn", { imageUrl })

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
      throw new Error(`Failed to register upload: ${registerResponse.status} ${errorText}`)
    }

    const registerData = await registerResponse.json()

    // Step 2: Download the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    // Step 3: Upload the image
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
      throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`)
    }

    this.logger.info("Image uploaded successfully to LinkedIn")
    return registerData.value.asset
  }
}
