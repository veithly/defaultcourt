import { NextResponse } from "next/server";
import { writeResolvedCaseOnPortaldot } from "@/lib/portaldot-contract";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const caseId = Number.isFinite(Number(body.caseId)) ? Number(body.caseId) : 1;
  const result = await writeResolvedCaseOnPortaldot(caseId);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
