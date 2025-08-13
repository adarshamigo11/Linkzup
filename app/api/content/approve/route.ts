import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId } = await req.json()

    if (!contentId) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Check which collection to use
    const generatedContentsCollection = mongoose.connection.db.collection("generatedcontents")
    const generatedContentsCount = await generatedContentsCollection.countDocuments()

    let collection
    let userIdField

    if (generatedContentsCount > 0) {
      collection = generatedContentsCollection
      userIdField = "userId"
    } else {
      collection = mongoose.connection.db.collection("linkdin-content-generation")
      userIdField = "User ID\t"
    }

    // Find the content
    const content = await collection.findOne({
      _id: new mongoose.Types.ObjectId(contentId),
      $or: [{ [userIdField]: session.user.id }, { [userIdField]: new mongoose.Types.ObjectId(session.user.id) }],
      status: "pending",
    })

    if (!content) {
      return NextResponse.json({ error: "Pending content not found" }, { status: 404 })
    }

    // Check if user has LinkedIn connected
    const user = await User.findById(session.user.id).select("linkedinProfile linkedinAccessToken linkedinTokenExpiry")

    if (!user?.linkedinAccessToken || !user?.linkedinProfile?.id) {
      return NextResponse.json(
        {
          error: "LinkedIn account not connected. Please connect your LinkedIn account first.",
        },
        { status: 400 },
      )
    }

    // Check if LinkedIn token is still valid
    if (user.linkedinTokenExpiry && new Date(user.linkedinTokenExpiry) <= new Date()) {
      return NextResponse.json(
        {
          error: "LinkedIn token expired. Please reconnect your LinkedIn account.",
        },
        { status: 400 },
      )
    }

    // Update content status
    const updateData: any = {
      status: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
      modifiedTime: new Date(),
      $unset: { rejectionReason: 1, error: 1 },
    }



    const result = await collection.updateOne(
      {
        _id: new mongoose.Types.ObjectId(contentId),
        $or: [{ [userIdField]: session.user.id }, { [userIdField]: new mongoose.Types.ObjectId(session.user.id) }],
      },
      updateData,
    )
    console.log(`APPROVE_DEBUG: ContentId=${contentId}, UpdatedStatus=${updateData.status}`);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Content not found or unauthorized" }, { status: 404 })
    }

    console.log(`✅ Content ${contentId} approved`)

    return NextResponse.json({
      success: true,
      message: "Content approved successfully!",
    })
  } catch (error: any) {
    console.error("Error approving content:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to approve content",
      },
      { status: 500 },
    )
  }
}
