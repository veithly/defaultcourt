import { NextResponse } from "next/server";
import { readContractMetadata } from "@/lib/portaldot-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await readContractMetadata());
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Compiled ink! metadata is missing. Build contracts/default_court with cargo-contract before browser-wallet contract calls."
      },
      { status: 404 }
    );
  }
}
