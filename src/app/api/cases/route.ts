import { NextResponse } from "next/server";
import { listCases } from "@/lib/cases";

export async function GET() {
  return NextResponse.json(await listCases());
}

