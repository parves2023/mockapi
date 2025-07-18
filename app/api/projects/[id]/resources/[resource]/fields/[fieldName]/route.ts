import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Project } from "@/lib/models/Project"
import { getAuthenticatedUser } from "@/lib/middleware"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; resource: string; fieldName: string } },
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const project = await Project.findOne({ _id: params.id, userId: user._id })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const resource = project.resources.find((r) => r.name === params.resource)
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Remove field
    resource.fields = resource.fields.filter((f) => f.name !== params.fieldName)
    await project.save()

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Delete field error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
