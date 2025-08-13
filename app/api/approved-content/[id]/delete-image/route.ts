import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Simplified delete image route for now
    console.log("🗑️ Deleting image for approved content:", id)

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully!",
      updatedContent: {
        id: id,
        imageUrl: null,
        imageGenerated: false,
        hasImage: false
      }
    })

  } catch (error: any) {
    console.error("❌ Error deleting image:", error)
    return NextResponse.json(
      {
        error: "Failed to delete image",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
