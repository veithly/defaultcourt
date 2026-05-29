import { Nav } from "@/components/nav";

export default function AboutPage() {
  return (
    <main data-visual-lane="data-newsroom" data-hero-composition="architecture-brief">
      <Nav />
      <section className="shell panel mb-12 p-6">
        <div className="news-label">Architecture</div>
        <h1 className="mt-3 text-5xl font-black">A default room with an honest Portaldot boundary.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">DefaultCourt separates the reviewer-visible workflow from the privileged chain write path. Production case state persists in Cloudflare KV, local runs use a JSON ledger, and Portaldot RPC is read live. Contract writes require a funded mnemonic and never fall back to fabricated receipts.</p>
      </section>
    </main>
  );
}
