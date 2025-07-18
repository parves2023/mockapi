// lib/cors.ts
import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

export function handleCors(req: NextRequest) {
  const origin = req.headers.get("origin");
  const res = new NextResponse();

  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    res.headers.set("Access-Control-Allow-Origin", "*");
  }

  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}
