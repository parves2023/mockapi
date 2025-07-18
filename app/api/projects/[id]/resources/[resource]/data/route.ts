// app/api/[id]/[resource]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { ResourceData } from "@/lib/models/ResourceData";
import { getAuthenticatedUser } from "@/lib/middleware";
import { handleCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  const res = handleCors(request);
  return new NextResponse(null, {
    status: 204,
    headers: res.headers,
  });
}

export async function GET(request: NextRequest, { params }: { params: { id: string; resource: string } }) {
  const corsRes = handleCors(request);

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsRes.headers,
      });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    await dbConnect();

    const project = await Project.findOne({ _id: params.id, userId: user._id });
    if (!project) {
      return new NextResponse(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: corsRes.headers,
      });
    }

    const data = await ResourceData.find({
      projectId: params.id,
      resourceName: params.resource,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ResourceData.countDocuments({
      projectId: params.id,
      resourceName: params.resource,
    });

    return new NextResponse(JSON.stringify({ data, total, page, limit }), {
      status: 200,
      headers: corsRes.headers,
    });

  } catch (error) {
    console.error("Get resource data error:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsRes.headers,
    });
  }
}
