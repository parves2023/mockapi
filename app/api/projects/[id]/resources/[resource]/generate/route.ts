import { type NextRequest, NextResponse } from "next/server"
import { faker } from "@faker-js/faker"
import dbConnect from "@/lib/mongodb"
import { Project } from "@/lib/models/Project"
import { ResourceData } from "@/lib/models/ResourceData"
import { getAuthenticatedUser } from "@/lib/middleware"

function generateFieldValue(type: string) {
  switch (type) {
    case "string":
      return faker.lorem.words(3)
    case "number":
      return faker.number.int({ min: 1, max: 1000 })
    case "boolean":
      return faker.datatype.boolean()
    case "null":
      return null
    case "undefined":
      return undefined
    default:
      return faker.lorem.word()
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string; resource: string } }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { count = 10 } = await request.json()

    await dbConnect()
    const project = await Project.findOne({ _id: params.id, userId: user._id })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const resource = project.resources.find((r) => r.name === params.resource)
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    if (resource.fields.length === 0) {
      return NextResponse.json({ error: "No fields defined for this resource" }, { status: 400 })
    }

    // Generate dummy data
    const records = []
    for (let i = 0; i < Math.min(count, 100); i++) {
      const data: Record<string, any> = {}

      resource.fields.forEach((field) => {
        data[field.name] = generateFieldValue(field.type)
      })

      records.push({
        projectId: params.id,
        resourceName: params.resource,
        data,
      })
    }

    await ResourceData.insertMany(records)

    return NextResponse.json({ message: `Generated ${records.length} records` })
  } catch (error) {
    console.error("Generate data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
