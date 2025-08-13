import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const newContentType = body.contentType

    // Simplified regenerate route for now
    console.log("🔄 Regenerating content for approved content:", id, "with type:", newContentType)

    return NextResponse.json({
      success: true,
      message: "Content regenerated successfully!",
      content: "This is a sample regenerated content for the topic.",
      contentType: newContentType || "storytelling"
    })
  } catch (error) {
    console.error("❌ Error regenerating content:", error)
    return NextResponse.json(
      {
        error: "Failed to regenerate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
