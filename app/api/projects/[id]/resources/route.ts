import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Project } from "@/lib/models/Project"
import { getAuthenticatedUser } from "@/lib/middleware"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Resource name is required" }, { status: 400 })
    }

    await dbConnect()
    const project = await Project.findOne({ _id: params.id, userId: user._id })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if resource already exists
    const existingResource = project.resources.find((r) => r.name.toLowerCase() === name.toLowerCase())
    if (existingResource) {
      return NextResponse.json({ error: "Resource already exists" }, { status: 400 })
    }

    // Add new resource
    project.resources.push({
      name: name.toLowerCase(),
      fields: [],
    })

    await project.save()

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Create resource error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
