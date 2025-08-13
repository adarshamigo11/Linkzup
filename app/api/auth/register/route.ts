import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          message: "Please provide name, email, and password",
        },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already exists with this email",
        },
        { status: 400 },
      )
    }

    // Create new user with password
    const user = await User.create({
      name,
      email,
      password, // This will be hashed by the pre-save hook
      onboardingCompleted: false,
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        message: error.message || "Something went wrong during registration",
      },
      { status: 500 },
    )
  }
}
