import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Project } from "@/lib/models/Project"
import { getAuthenticatedUser } from "@/lib/middleware"

export async function POST(request: NextRequest, { params }: { params: { id: string; resource: string } }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, required } = await request.json()

    await dbConnect()
    const project = await Project.findOne({ _id: params.id, userId: user._id })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const resource = project.resources.find((r) => r.name === params.resource)
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Check if field already exists
    const existingField = resource.fields.find((f) => f.name === name)
    if (existingField) {
      return NextResponse.json({ error: "Field already exists" }, { status: 400 })
    }

    // Add new field
    resource.fields.push({ name, type, required })
    await project.save()

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Add field error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; resource: string } }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, required, originalName } = await request.json()

    await dbConnect()
    const project = await Project.findOne({ _id: params.id, userId: user._id })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const resource = project.resources.find((r) => r.name === params.resource)
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    const fieldIndex = resource.fields.findIndex((f) => f.name === (originalName || name))
    if (fieldIndex === -1) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 })
    }

    // Update field
    resource.fields[fieldIndex] = { name, type, required }
    await project.save()

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Update field error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
