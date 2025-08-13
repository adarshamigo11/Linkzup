import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import mongoose from "mongoose"
import { ISTTime } from "@/lib/utils/ist-time"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    await connectDB()

    // Get user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find and delete the scheduled post
    const scheduledPost = await ScheduledPost.findOneAndDelete({
      _id: id,
      userId: user._id,
    })

    if (!scheduledPost) {
      return NextResponse.json({ error: "Scheduled post not found" }, { status: 404 })
    }

    console.log("✅ Scheduled post deleted:", id)

    return NextResponse.json({
      success: true,
      message: "Scheduled post cancelled successfully",
    })
  } catch (error: any) {
    console.error("❌ Error deleting scheduled post:", error)
    return NextResponse.json({ error: error.message || "Failed to cancel scheduled post" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { scheduledTimeIST, content, imageUrl } = body

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    await connectDB()

    // Get user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the scheduled post
    const scheduledPost = await ScheduledPost.findOne({
      _id: id,
      userId: user._id,
    })

    if (!scheduledPost) {
      return NextResponse.json({ error: "Scheduled post not found" }, { status: 404 })
    }

    // Only allow updates to pending posts
    if (scheduledPost.status !== "pending") {
      return NextResponse.json({ error: "Can only update pending scheduled posts" }, { status: 400 })
    }

    // Update fields
    const updateData: any = {}

    if (scheduledTimeIST) {
      const istDate = new Date(scheduledTimeIST)
      const utcDate = ISTTime.istToUtc(istDate)
      updateData.scheduledTime = utcDate
      updateData.scheduledTimeIST = ISTTime.formatIST(utcDate)
    }

    if (content !== undefined) {
      updateData.content = content.trim()
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl
    }

    // Update the post
    const updatedPost = await ScheduledPost.findByIdAndUpdate(id, updateData, { new: true })

    console.log("✅ Scheduled post updated:", id)

    return NextResponse.json({
      success: true,
      message: "Scheduled post updated successfully",
      scheduledPost: updatedPost,
    })
  } catch (error: any) {
    console.error("❌ Error updating scheduled post:", error)
    return NextResponse.json({ error: error.message || "Failed to update scheduled post" }, { status: 500 })
  }
}
