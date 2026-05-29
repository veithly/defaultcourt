import { NextResponse } from "next/server";
import { getCase } from "@/lib/cases";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courtCase = await getCase(id);
  if (!courtCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json(courtCase);
}

