// app/api/[projectId]/[resource]/[id]/route.ts

import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { ResourceData } from "@/lib/models/ResourceData";

function setCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Replace '*' with your frontend URL in production
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  };
}

async function validateApiKey(request: NextRequest, projectId: string) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return { error: "API key is required", status: 401 };
  }

  await dbConnect();
  const project = await Project.findOne({ _id: projectId, apiKey });

  if (!project) {
    return { error: "Invalid API key", status: 401 };
  }

  return { project };
}

export async function OPTIONS() {
  // Reply to preflight CORS request
  return new NextResponse(null, {
    headers: setCorsHeaders(),
  });
}

// GET - Get single record
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; resource: string; id: string } }
) {
  try {
    const validation = await validateApiKey(request, params.projectId);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status, headers: setCorsHeaders() }
      );
    }

    const resource = validation.project!.resources.find((r) => r.name === params.resource);
    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404, headers: setCorsHeaders() }
      );
    }

    const record = await ResourceData.findOne({
      _id: params.id,
      projectId: params.projectId,
      resourceName: params.resource,
    }).lean();

    if (!record) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404, headers: setCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        _id: record._id,
        ...record.data,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      { headers: setCorsHeaders() }
    );
  } catch (error) {
    console.error("API GET single error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: setCorsHeaders() }
    );
  }
}

// PUT - Update entire record
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; resource: string; id: string } }
) {
  try {
    const validation = await validateApiKey(request, params.projectId);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status, headers: setCorsHeaders() }
      );
    }

    const body = await request.json();

    const resource = validation.project!.resources.find((r) => r.name === params.resource);
    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404, headers: setCorsHeaders() }
      );
    }

    // Validate required fields
    const missingFields = resource.fields
      .filter((field) => field.required && (body[field.name] === undefined || body[field.name] === null))
      .map((field) => field.name);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400, headers: setCorsHeaders() }
      );
    }

    // Filter body to only include defined fields
    const filteredData: Record<string, any> = {};
    resource.fields.forEach((field) => {
      if (body[field.name] !== undefined) {
        filteredData[field.name] = body[field.name];
      }
    });

    const updatedRecord = await ResourceData.findOneAndUpdate(
      {
        _id: params.id,
        projectId: params.projectId,
        resourceName: params.resource,
      },
      { data: filteredData },
      { new: true }
    );

    if (!updatedRecord) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404, headers: setCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        _id: updatedRecord._id,
        ...updatedRecord.data,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt,
      },
      { headers: setCorsHeaders() }
    );
  } catch (error) {
    console.error("API PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: setCorsHeaders() }
    );
  }
}

// PATCH - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; resource: string; id: string } }
) {
  try {
    const validation = await validateApiKey(request, params.projectId);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status, headers: setCorsHeaders() }
      );
    }

    const body = await request.json();

    const resource = validation.project!.resources.find((r) => r.name === params.resource);
    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404, headers: setCorsHeaders() }
      );
    }

    const currentRecord = await ResourceData.findOne({
      _id: params.id,
      projectId: params.projectId,
      resourceName: params.resource,
    });

    if (!currentRecord) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404, headers: setCorsHeaders() }
      );
    }

    const updatedData = { ...currentRecord.data };
    resource.fields.forEach((field) => {
      if (body[field.name] !== undefined) {
        updatedData[field.name] = body[field.name];
      }
    });

    // Validate required fields after update
    const missingFields = resource.fields
      .filter((field) => field.required && (updatedData[field.name] === undefined || updatedData[field.name] === null))
      .map((field) => field.name);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400, headers: setCorsHeaders() }
      );
    }

    const updatedRecord = await ResourceData.findOneAndUpdate(
      {
        _id: params.id,
        projectId: params.projectId,
        resourceName: params.resource,
      },
      { data: updatedData },
      { new: true }
    );

    return NextResponse.json(
      {
        _id: updatedRecord!._id,
        ...updatedRecord!.data,
        createdAt: updatedRecord!.createdAt,
        updatedAt: updatedRecord!.updatedAt,
      },
      { headers: setCorsHeaders() }
    );
  } catch (error) {
    console.error("API PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: setCorsHeaders() }
    );
  }
}

// DELETE - Delete record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; resource: string; id: string } }
) {
  try {
    const validation = await validateApiKey(request, params.projectId);
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status, headers: setCorsHeaders() }
      );
    }

    const resource = validation.project!.resources.find((r) => r.name === params.resource);
    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404, headers: setCorsHeaders() }
      );
    }

    const deletedRecord = await ResourceData.findOneAndDelete({
      _id: params.id,
      projectId: params.projectId,
      resourceName: params.resource,
    });

    if (!deletedRecord) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404, headers: setCorsHeaders() }
      );
    }

    return NextResponse.json(
      { message: "Record deleted successfully" },
      { headers: setCorsHeaders() }
    );
  } catch (error) {
    console.error("API DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: setCorsHeaders() }
    );
  }
}