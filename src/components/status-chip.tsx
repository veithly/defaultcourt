import type { CaseStatus } from "@/lib/types";
import { statusLabel } from "@/lib/types";

export function StatusChip({ status }: { status: CaseStatus }) {
  const color = status === "resolved" ? "var(--success)" : status === "performing" ? "var(--gold)" : "var(--danger)";
  return (
    <span className="inline-flex min-h-8 items-center border px-3 text-xs font-black uppercase tracking-[0.14em]" style={{ borderColor: color, color }}>
      {statusLabel(status)}
    </span>
  );
}
