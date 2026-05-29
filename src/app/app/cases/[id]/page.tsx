import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { StatusChip } from "@/components/status-chip";
import { getCase } from "@/lib/cases";
import { dateTime, usd } from "@/lib/format";

export default async function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courtCase = await getCase(id);
  if (!courtCase) notFound();
  const approvals = courtCase.votes.filter((vote) => vote.decision === "approve").length;
  return (
    <main data-visual-lane="data-newsroom" data-hero-composition="evidence-ledger">
      <Nav />
      <section className="shell grid gap-5 pb-12 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="panel p-5">
          <div className="news-label">Resolution receipt</div>
          <h1 className="mt-3 text-4xl font-black">{courtCase.id}</h1>
          <div className="mt-4"><StatusChip status={courtCase.status} /></div>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-[var(--line)] pb-2"><dt>Borrower</dt><dd>{courtCase.borrower}</dd></div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2"><dt>Lender</dt><dd>{courtCase.lender}</dd></div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2"><dt>Exposure</dt><dd>{usd(courtCase.exposureUsd)}</dd></div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2"><dt>Approvals</dt><dd>{approvals}/3</dd></div>
          </dl>
          <pre className="mt-5 max-h-72 overflow-auto whitespace-pre-wrap border border-[var(--line)] bg-black/30 p-4 text-sm">{courtCase.receiptText}</pre>
          <Link className="sharp-button secondary focus-ring mt-5 inline-block w-full text-center" href="/app">Back to court</Link>
        </aside>
        <section className="panel p-5">
          <div className="news-label">Evidence ledger</div>
          <ol className="mt-5 space-y-5">
            {courtCase.timeline.map((event) => (
              <li key={event.id} className="border-l border-[var(--line)] pl-5">
                <div className="font-black">{event.label}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{dateTime(event.at)} · {event.actor}</div>
                <p className="mt-2 text-[var(--paper)]/85">{event.detail}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 border border-[var(--line)] p-4">
            <div className="news-label">Evidence hashes</div>
            {courtCase.evidence.length ? courtCase.evidence.map((item) => (
              <div key={item.id} className="mt-3 text-sm">
                <strong>{item.label}</strong>
                <div className="overflow-wrap-anywhere mt-1 text-[var(--muted)]">{item.hash}</div>
              </div>
            )) : <p className="mt-3 text-sm text-[var(--muted)]">No evidence filed yet.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}

