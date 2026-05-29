"use client";

import { useState } from "react";
import Link from "next/link";
import type { CourtCase } from "@/lib/types";
import { statusLabel } from "@/lib/types";
import { dateTime, usd } from "@/lib/format";

type Props = {
  initialCase: CourtCase;
};

async function postEvent(id: string, action: string) {
  const res = await fetch(`/api/cases/${id}/event`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as CourtCase;
}

export function CaseRoom({ initialCase }: Props) {
  const [courtCase, setCourtCase] = useState(initialCase);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const pending = pendingAction !== null;
  const approvals = courtCase.votes.filter((vote) => vote.decision === "approve").length;
  const stateClass = courtCase.status === "resolved" ? "success" : courtCase.status === "performing" ? "" : "danger";
  const workflowSteps = [
    { step: 1, marker: "step 1", label: "Trigger breach", done: courtCase.status !== "performing", risk: courtCase.status === "performing" ? 18 : 74 },
    { step: 2, marker: "step 2", label: "Attach evidence", done: courtCase.evidence.length > 0, risk: courtCase.evidence.length ? 68 : 32 },
    { step: 3, marker: "step 3", label: "Guardian quorum", done: approvals >= 2, risk: approvals >= 2 ? 40 : 62 },
    { step: 4, marker: "step 4", label: "Close receipt", done: courtCase.status === "resolved", risk: courtCase.status === "resolved" ? 14 : 48 }
  ];

  function run(action: "breach" | "evidence" | "vote" | "resolve") {
    setPendingAction(action);
    void (async () => {
      try {
        const next = await postEvent(courtCase.id, action);
        setCourtCase(next);
      } finally {
        setPendingAction(null);
      }
    })();
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]" data-testid="case-room">
      <div className={`panel state-band ${stateClass} p-5`}>
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-5 md:flex-row">
          <div>
            <div className="news-label">Active credit case</div>
            <h1 className="mt-2 text-4xl font-black leading-tight">{courtCase.borrower}</h1>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">{courtCase.collateral}</p>
          </div>
          <div className="min-w-48 border border-[var(--line)] p-4 text-right">
            <div className="news-label">Exposure</div>
            <div className="text-2xl font-black">{usd(courtCase.exposureUsd)}</div>
            <div className="mt-2 text-sm text-[var(--muted)]">{statusLabel(courtCase.status)}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button className="sharp-button danger focus-ring" disabled={pending} onClick={() => run("breach")}>Trigger covenant breach</button>
          <button className="sharp-button secondary focus-ring" disabled={pending} onClick={() => run("evidence")}>Attach evidence</button>
          <button className="sharp-button secondary focus-ring" disabled={pending} onClick={() => run("vote")}>Cast guardian vote</button>
          <button className="sharp-button success focus-ring" disabled={pending || approvals < 2} onClick={() => run("resolve")}>Resolve recovery</button>
        </div>

        <div className="mt-6 border border-[var(--line)] bg-black/20 p-4">
          <div className="news-label">Risk curve</div>
          <div className="mt-4 grid gap-3">
            {workflowSteps.map((item) => (
              <div key={item.marker} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="text-[var(--muted)]">{item.label}</span>
                <span className="h-3 bg-white/10">
                  <span className="block h-3 bg-[var(--danger)]" style={{ width: `${item.risk}%` }} />
                </span>
                <strong>{item.risk}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border border-[var(--line)] p-4">
            <div className="news-label">Guardian quorum</div>
            <div className="mt-3 h-3 bg-white/10">
              <div className="h-3 bg-[var(--success)]" style={{ width: `${Math.min(100, approvals * 50)}%` }} />
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">{approvals}/2 approvals needed to close recovery.</p>
            <Link className="focus-ring mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[var(--gold)] underline" href="/app/guardians">Open guardian board</Link>
          </div>
          <div className="border border-[var(--line)] p-4">
            <div className="news-label">Portaldot receipt boundary</div>
            <p className="mt-3 text-sm text-[var(--muted)]">The write path waits for a funded <code>PORTALDOT_MNEMONIC</code>. No fabricated hash is shown.</p>
            <Link className="focus-ring mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[var(--gold)] underline" href="/app/contract">Inspect contract proof</Link>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {workflowSteps.map((item) => (
            <div key={item.step} className="border border-[var(--line)] p-3 text-sm">
              <div className="news-label">Step {item.step}</div>
              <div className={item.done ? "mt-1 font-black text-[var(--success)]" : "mt-1 font-black text-[var(--muted)]"}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <aside className="panel p-5">
        <div className="news-label">Evidence timeline</div>
        <ol className="mt-4 space-y-4">
          {courtCase.timeline.slice().reverse().map((item) => (
            <li key={item.id} className="border-l border-[var(--line)] pl-4">
              <div className="text-sm font-black">{item.label}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{dateTime(item.at)} · {item.actor}</div>
              <p className="mt-2 text-sm text-[var(--paper)]/85">{item.detail}</p>
            </li>
          ))}
        </ol>
        <Link className="sharp-button secondary focus-ring mt-5 inline-block w-full text-center" href={`/app/cases/${courtCase.id}`}>Open receipt</Link>
      </aside>
    </section>
  );
}
