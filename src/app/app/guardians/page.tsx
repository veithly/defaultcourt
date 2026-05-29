import { Nav } from "@/components/nav";
import { CaseRoom } from "@/components/case-room";
import { listCases } from "@/lib/cases";

export default async function GuardiansPage() {
  const [courtCase] = await listCases();
  return (
    <main data-visual-lane="data-newsroom" data-hero-composition="guardian-quorum">
      <Nav />
      <section className="shell pb-12">
        <div className="panel mb-5 p-5">
          <div className="news-label">Guardian board</div>
          <h1 className="mt-2 text-4xl font-black">Two approvals close the recovery path.</h1>
          <p className="mt-3 max-w-3xl text-[var(--muted)]">Use the case controls below to cast guardian approvals. Votes persist in the local case ledger and unlock resolution at quorum.</p>
        </div>
        <CaseRoom initialCase={courtCase} />
      </section>
    </main>
  );
}

