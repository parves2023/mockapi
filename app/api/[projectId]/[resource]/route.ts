import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Project } from "@/lib/models/Project"
import { ResourceData } from "@/lib/models/ResourceData"

function setCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Replace '*' with your frontend URL in production
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  }
}

async function validateApiKey(request: NextRequest, projectId: string) {
  const apiKey = request.headers.get("x-api-key")

  if (!apiKey) {
    return { error: "API key is required", status: 401 }
  }

  await dbConnect()
  const project = await Project.findOne({ _id: projectId, apiKey })

  if (!project) {
    return { error: "Invalid API key", status: 401 }
  }

  return { project }
}

// OPTIONS handler for preflight requests
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: setCorsHeaders(),
  })
}

// GET - List all records
export async function GET(request: NextRequest, { params }: { params: { projectId: string; resource: string } }) {
  try {
    const validation = await validateApiKey(request, params.projectId)
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status, headers: setCorsHeaders() }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100)
    const sort = searchParams.get("sort") || "createdAt"
    const order = searchParams.get("order") === "asc" ? 1 : -1
    const skip = (page - 1) * limit

    const resource = validation.project!.resources.find((r) => r.name === params.resource)
    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404, headers: setCorsHeaders() }
      )
    }

    const data = await ResourceData.find({
      projectId: params.projectId,
      resourceName: params.resource,
    })
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await ResourceData.countDocuments({
      projectId: params.projectId,
      resourceName: params.resource,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      {
        data: data.map((item) => ({
          _id: item._id,
          ...item.data,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        total,
        page,
        limit,
        totalPages,
      },
      {
        status: 200,
        headers: setCorsHeaders(),
      }
    )
  } catch (error) {
    console.error("API GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: setCorsHeaders() }
    )
  }
}

// POST - Create new record
export async function POST(request: NextRequest, { params }: { params: { projectId: string; resource: string } }) {
  try {
    const validation = await validateApiKey(request, params.projectId)
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status, headers: setCorsHeaders() }
      )
    }

    const body = await request.json()

    const resource = validation.project!.resources.find((r) => r.name === params.resource)
    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404, headers: setCorsHeaders() }
      )
    }

    // Validate required fields
    const missingFields = resource.fields
      .filter((field) => field.required && (body[field.name] === undefined || body[field.name] === null))
      .map((field) => field.name)

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400, headers: setCorsHeaders() }
      )
    }

    // Filter body to only include defined fields
    const filteredData: Record<string, any> = {}
    resource.fields.forEach((field) => {
      if (body[field.name] !== undefined) {
        filteredData[field.name] = body[field.name]
      }
    })

    const newRecord = await ResourceData.create({
      projectId: params.projectId,
      resourceName: params.resource,
      data: filteredData,
    })

    return NextResponse.json(
      {
        _id: newRecord._id,
        ...newRecord.data,
        createdAt: newRecord.createdAt,
        updatedAt: newRecord.updatedAt,
      },
      {
        status: 201,
        headers: setCorsHeaders(),
      }
    )
  } catch (error) {
    console.error("API POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: setCorsHeaders() }
    )
  }
}
