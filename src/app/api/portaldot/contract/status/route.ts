import { NextResponse } from "next/server";
import { getContractReadiness } from "@/lib/portaldot-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getContractReadiness());
}
