import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Content from "@/models/Content";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== "admin@zuperstudio.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const url = new URL(req.url, "http://localhost");
  const filter = url.searchParams.get("filter");
  let query: Record<string, unknown> = {};
  if (filter === "active") query = { subscriptionStatus: "active" };
  if (filter === "free") query = { subscriptionStatus: "free" };
  const users: any[] = await User.find(query).lean();
  // Get content count for each user
  const userIds = users.map((u) => u._id);
  const contentCounts = await Content.aggregate([
    { $match: { user_id: { $in: userIds } } },
    { $group: { _id: "$user_id", count: { $sum: 1 } } },
  ]);
  const contentCountMap = Object.fromEntries(contentCounts.map((c: any) => [c._id.toString(), c.count]));
  // Count active/free users
  const allUsers: any[] = await User.find({}).lean();
  const activeCount = allUsers.filter((u) => u.subscriptionStatus === "active").length;
  const freeCount = allUsers.filter((u) => u.subscriptionStatus === "free").length;
  // Attach content count and subscription details to each user
  const usersWithContent = users.map((u) => ({
    ...u,
    contentCount: contentCountMap[String(u._id)] || 0,
    subscriptionStart: (u as any).subscriptionStart || u.createdAt,
    subscriptionExpiry: (u as any).subscriptionExpiry,
    subscriptionAmount: (u as any).subscriptionAmount || null,
  }));
  return NextResponse.json({ users: usersWithContent, activeCount, freeCount });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== "admin@zuperstudio.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const { userId, blocked } = await req.json();
  const user = await User.findByIdAndUpdate(userId, { blocked }, { new: true });
  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  // This endpoint is for fetching the blocked status of the current user by email
  const { email } = await req.json();
  if (!email) return NextResponse.json({ blocked: false });
  await connectDB();
  const user = await User.findOne({ email });
  return NextResponse.json({ blocked: user?.blocked || false });
}
