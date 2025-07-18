import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Project } from "@/lib/models/Project"
import { ResourceData } from "@/lib/models/ResourceData"
import { getAuthenticatedUser } from "@/lib/middleware"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; resource: string; recordId: string } },
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Verify project ownership
    const project = await Project.findOne({ _id: params.id, userId: user._id })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const result = await ResourceData.findOneAndDelete({
      _id: params.recordId,
      projectId: params.id,
      resourceName: params.resource,
    })

    if (!result) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("Delete record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
