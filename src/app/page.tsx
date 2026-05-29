import Link from "next/link";
import { ShieldCheck, FileClock, Scale } from "lucide-react";
import { Nav } from "@/components/nav";
import { ChainStatusRail } from "@/components/chain-status";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main data-visual-lane="data-newsroom" data-hero-composition="credit-war-room">
      <Nav />
      <section className="shell grid gap-6 pb-12 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-6 md:p-8">
          <div className="news-label">Portaldot default operations room</div>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.95] md:text-7xl">
            Missed covenants become recovery receipts.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            DefaultCourt gives RWA credit teams a Portaldot-native room for breach evidence, guardian votes, and resolution records without pretending a write happened before a funded POT signer exists.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="sharp-button focus-ring text-center" href="/app">Enter the court</Link>
            <Link className="sharp-button secondary focus-ring text-center" href="/app/contract">Inspect Portaldot proof</Link>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              [FileClock, "Default clock", "One click moves a loan into breach review."],
              [Scale, "Guardian quorum", "Votes persist and unlock the recovery receipt."],
              [ShieldCheck, "No fake hash", "Writes wait for a funded PORTALDOT_MNEMONIC."]
            ].map(([Icon, title, body]) => (
              <div key={String(title)} className="border border-[var(--line)] p-4">
                <Icon className="mb-4 h-6 w-6 text-[var(--gold)]" />
                <div className="font-black">{String(title)}</div>
                <p className="mt-2 text-sm text-[var(--muted)]">{String(body)}</p>
              </div>
            ))}
          </div>
        </div>
        <ChainStatusRail />
      </section>
    </main>
  );
}
