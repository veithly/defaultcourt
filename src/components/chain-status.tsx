import { getPortaldotStatus } from "@/lib/portaldot";
import { shortHash } from "@/lib/format";

export async function ChainStatusRail() {
  const status = await getPortaldotStatus();
  return (
    <section className="panel p-5" aria-label="Live Portaldot status">
      <div className="news-label">Live Portaldot rail</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-3xl font-black">{status.ok ? "Online" : "Degraded"}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">{status.endpoint}</div>
        </div>
        <div className="text-sm">
          <div className="flex justify-between border-b border-[var(--line)] py-2">
            <span>Token</span><strong>{status.token}</strong>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] py-2">
            <span>Decimals</span><strong>{status.decimals}</strong>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] py-2">
            <span>Finalized head</span><strong>{shortHash(status.finalizedHead)}</strong>
          </div>
          <div className="flex justify-between py-2">
            <span>Latency</span><strong>{status.latencyMs}ms</strong>
          </div>
        </div>
      </div>
      {status.error ? <p className="mt-4 text-sm text-[var(--danger)]">{status.error}</p> : null}
    </section>
  );
}

