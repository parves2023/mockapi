import type { NextRequest } from "next/server"
import { verifyToken } from "./auth"
import dbConnect from "./mongodb"
import { User } from "./models/User"

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    await dbConnect()
    const user = await User.findById(decoded.userId).select("-password")

    return user
  } catch (error) {
    console.error("Auth middleware error:", error)
    return null
  }
}
