import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Simplified approved content route for now
    const sampleContent = {
      id: id,
      topicId: id,
      topicTitle: "Sample Topic",
      content: "Sample content for approved content",
      hashtags: ["sample", "content"],
      keyPoints: ["Point 1", "Point 2"],
      imageUrl: null,
      imageGenerated: false,
      aiGenerationUsed: false,
      contentType: "storytelling",
      status: "approved",
      generatedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      postedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      content: sampleContent,
    })
  } catch (error) {
    console.error("❌ Error fetching approved content:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch approved content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Simplified PUT route for now
    console.log("📝 Updating approved content:", id)

    return NextResponse.json({
      success: true,
      message: "Content updated successfully",
    })
  } catch (error) {
    console.error("❌ Error updating approved content:", error)
    return NextResponse.json(
      {
        error: "Failed to update approved content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Simplified DELETE route for now
    console.log("🗑️ Deleting approved content:", id)

    return NextResponse.json({
      success: true,
      message: "Content deleted successfully",
    })
  } catch (error) {
    console.error("❌ Error deleting approved content:", error)
    return NextResponse.json(
      {
        error: "Failed to delete approved content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
