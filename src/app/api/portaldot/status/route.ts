import { NextResponse } from "next/server";
import { getPortaldotStatus, sendTransactionPlan } from "@/lib/portaldot";

export async function GET() {
  const status = await getPortaldotStatus();
  return NextResponse.json({ ...status, writePlan: sendTransactionPlan() });
}
