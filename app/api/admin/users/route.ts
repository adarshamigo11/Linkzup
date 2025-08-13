import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    return NextResponse.json({ users: [], activeCount: 0, freeCount: 0 });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    return NextResponse.json({ blocked: false });
  } catch (error) {
    console.error("Admin users POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
