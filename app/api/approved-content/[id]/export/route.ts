import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { format = "json" } = await req.json()

    // Simplified export route for now
    const sampleContent = {
      id: id,
      topicTitle: "Sample Topic",
      content: "Sample content for export",
      hashtags: ["sample", "export"],
      keyPoints: ["Point 1", "Point 2"],
      platform: "linkedin",
      contentType: "storytelling",
      status: "generated",
      createdAt: new Date().toISOString()
    }

    let exportData: any
    let contentType: string
    let filename: string

    switch (format.toLowerCase()) {
      case "json":
        exportData = JSON.stringify(sampleContent, null, 2)
        contentType = "application/json"
        filename = `content-${id}.json`
        break

      case "txt":
        exportData = `Topic: ${sampleContent.topicTitle}\n\nContent:\n${sampleContent.content}\n\nHashtags: ${sampleContent.hashtags.join(", ")}\n\nKey Points:\n${sampleContent.keyPoints.map(point => `- ${point}`).join("\n")}\n\nPlatform: ${sampleContent.platform}\nContent Type: ${sampleContent.contentType}\nStatus: ${sampleContent.status}\nCreated: ${new Date(sampleContent.createdAt).toLocaleString()}`
        contentType = "text/plain"
        filename = `content-${id}.txt`
        break

      case "md":
        exportData = `# ${sampleContent.topicTitle}\n\n${sampleContent.content}\n\n## Hashtags\n${sampleContent.hashtags.map(tag => `#${tag}`).join(" ")}\n\n## Key Points\n${sampleContent.keyPoints.map(point => `- ${point}`).join("\n")}\n\n---\n\n**Platform:** ${sampleContent.platform}  \n**Content Type:** ${sampleContent.contentType}  \n**Status:** ${sampleContent.status}  \n**Created:** ${new Date(sampleContent.createdAt).toLocaleString()}`
        contentType = "text/markdown"
        filename = `content-${id}.md`
        break

      case "csv":
        exportData = `Topic Title,Content,Hashtags,Key Points,Platform,Content Type,Status,Created\n"${sampleContent.topicTitle}","${sampleContent.content}","${sampleContent.hashtags.join("; ")}","${sampleContent.keyPoints.join("; ")}","${sampleContent.platform}","${sampleContent.contentType}","${sampleContent.status}","${new Date(sampleContent.createdAt).toLocaleString()}"`
        contentType = "text/csv"
        filename = `content-${id}.csv`
        break

      default:
        return NextResponse.json({ error: "Unsupported export format" }, { status: 400 })
    }

    const response = new NextResponse(exportData)
    response.headers.set("Content-Type", contentType)
    response.headers.set("Content-Disposition", `attachment; filename="${filename}"`)
    response.headers.set("Cache-Control", "no-cache")

    return response
  } catch (error) {
    console.error("❌ Error exporting content:", error)
    return NextResponse.json(
      {
        error: "Failed to export content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
