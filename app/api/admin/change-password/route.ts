import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.email !== "admin@zuperstudio.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectDB();
    
    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }
    
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email: "admin@zuperstudio.com" },
      { password: hashed }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
