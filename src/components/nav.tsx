import Image from "next/image";
import Link from "next/link";

export function Nav() {
  return (
    <header className="shell flex items-center justify-between py-5">
      <Link href="/" className="focus-ring flex items-center gap-3" aria-label="DefaultCourt home">
        <Image src="/brand/logomark.svg" alt="DefaultCourt logomark" width={36} height={36} priority />
        <Image src="/brand/wordmark.svg" alt="DefaultCourt" width={178} height={48} priority />
      </Link>
      <nav className="hidden items-center gap-5 text-sm text-[var(--muted)] md:flex">
        <Link className="focus-ring hover:text-[var(--paper)]" href="/app">Court</Link>
        <Link className="focus-ring hover:text-[var(--paper)]" href="/app/guardians">Guardians</Link>
        <Link className="focus-ring hover:text-[var(--paper)]" href="/app/contract">Contract</Link>
        <Link className="focus-ring hover:text-[var(--paper)]" href="/about">Architecture</Link>
      </nav>
    </header>
  );
}
