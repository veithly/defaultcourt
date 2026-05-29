import { readFile } from "node:fs/promises";
import path from "node:path";
import { Nav } from "@/components/nav";
import { ChainStatusRail } from "@/components/chain-status";
import { sendTransactionPlan } from "@/lib/portaldot";

export const dynamic = "force-dynamic";

export default async function ContractPage() {
  const plan = sendTransactionPlan();
  let source = "Contract source will appear after implementation.";
  try {
    source = await readFile(path.join(process.cwd(), "contracts", "default_court", "lib.rs"), "utf8");
  } catch {}
  return (
    <main data-visual-lane="data-newsroom" data-hero-composition="chain-proof-desk">
      <Nav />
      <section className="shell grid gap-5 pb-12 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="grid gap-5">
          <ChainStatusRail />
          <div className="panel p-5">
            <div className="news-label">Write readiness</div>
            <h1 className="mt-3 text-3xl font-black">{plan.readiness ? "Funded signer configured" : "Waiting for funded mnemonic"}</h1>
            <p className="mt-3 text-[var(--muted)]">Method: {plan.method}</p>
            <p className="mt-2 text-[var(--muted)]">Signer: {plan.signer}</p>
            <p className="mt-2 text-[var(--muted)]">Contract: {plan.contractAddress ?? "not deployed yet"}</p>
          </div>
        </div>
        <div className="panel p-5">
          <div className="news-label">Open-source ink! contract</div>
          <pre data-allow-overflow="true" className="mt-4 max-h-[720px] overflow-auto whitespace-pre-wrap break-words border border-[var(--line)] bg-black/30 p-4 text-xs leading-5">{source}</pre>
        </div>
      </section>
    </main>
  );
}
