import { NextResponse } from "next/server";
import { z } from "zod";
import { advanceCase } from "@/lib/cases";

const Body = z.object({
  action: z.enum(["breach", "evidence", "vote", "resolve"])
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const courtCase = await advanceCase(id, parsed.data.action);
  if (!courtCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json(courtCase);
}

