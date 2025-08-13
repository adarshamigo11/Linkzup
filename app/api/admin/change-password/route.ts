import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Simplified admin route for now
    return NextResponse.json({ success: true, message: "Admin route working" });
  } catch (error) {
    console.error("Admin change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
