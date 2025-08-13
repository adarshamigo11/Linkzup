export interface ProcessedContent {
  valid: boolean
  content?: string
  imageUrl?: string
  error?: string
}

export class PostProcessor {
  constructor() {
    // No logger dependency needed
  }

  processContent(post: any): ProcessedContent {
    // Extract content from various possible fields
    const content = post.content || post.Content || post.text || ""

    if (!content || !content.trim()) {
      return {
        valid: false,
        error: "Post content is empty",
      }
    }

    // Extract image URL if present
    const imageUrl = post.imageUrl || post.Image || post.image_url || null

    // Validate content length (LinkedIn has limits)
    if (content.length > 3000) {
      console.warn("Content exceeds LinkedIn character limit", {
        length: content.length,
        postId: post._id,
      })

      return {
        valid: false,
        error: "Content exceeds LinkedIn character limit (3000 characters)",
      }
    }

    // Clean and format content
    const cleanedContent = this.cleanContent(content)

    console.log("Content processed successfully", {
      originalLength: content.length,
      cleanedLength: cleanedContent.length,
      hasImage: !!imageUrl,
    })

    return {
      valid: true,
      content: cleanedContent,
      imageUrl: imageUrl || undefined,
    }
  }

  private cleanContent(content: string): string {
    // Remove excessive whitespace
    let cleaned = content.replace(/\s+/g, " ").trim()

    // Ensure proper line breaks for readability
    cleaned = cleaned.replace(/\. /g, ".\n\n")

    // Remove any potential harmful characters
    cleaned = cleaned.replace(/[^\w\s\n.,!?@#$%&*()[\]{};:'"<>+=\-_/\\|`~]/g, "")

    return cleaned
  }
}
