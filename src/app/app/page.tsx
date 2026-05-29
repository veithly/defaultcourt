import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { CaseRoom } from "@/components/case-room";
import { ChainStatusRail } from "@/components/chain-status";
import { listCases } from "@/lib/cases";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const [courtCase] = await listCases();
  return (
    <main data-visual-lane="data-newsroom" data-hero-composition="credit-war-room">
      <Nav />
      <div className="shell grid gap-5 pb-12">
        <Suspense fallback={<section className="panel p-5"><div className="news-label">Live Portaldot rail</div><div className="mt-4 text-3xl font-black">Checking...</div></section>}>
          <ChainStatusRail />
        </Suspense>
        <CaseRoom initialCase={courtCase} />
      </div>
    </main>
  );
}
