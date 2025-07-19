import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { email, password, name } = await request.json()

    console.log(email, name, password)

    // Attempt to drop the old 'username' index (only once needed)
    await User.collection.dropIndex("username_1").catch((err) => {
      console.log("Index not found or already removed:", err.message);
    })

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    })


    // Generate JWT token
    const token = generateToken(user._id.toString())

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: "User created successfully",
      user: { id: user._id, email: user.email, name: user.name },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
