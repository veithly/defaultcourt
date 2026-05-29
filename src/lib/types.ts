export type CaseStatus = "performing" | "breach-active" | "evidence-filed" | "quorum-ready" | "resolved";

export type TimelineEvent = {
  id: string;
  at: string;
  label: string;
  detail: string;
  actor: string;
};

export type EvidenceItem = {
  id: string;
  label: string;
  hash: string;
  source: string;
  at: string;
};

export type GuardianVote = {
  guardian: string;
  decision: "approve" | "defer" | "reject";
  at: string;
};

export type CourtCase = {
  id: string;
  borrower: string;
  lender: string;
  collateral: string;
  exposureUsd: number;
  dueAt: string;
  status: CaseStatus;
  recoveryPlan: string;
  evidence: EvidenceItem[];
  votes: GuardianVote[];
  timeline: TimelineEvent[];
  receiptText: string;
  updatedAt: string;
};

export type ChainStatus = {
  ok: boolean;
  endpoint: string;
  chain: string;
  token: string;
  decimals: number;
  ss58Format: number;
  finalizedHead: string | null;
  blockNumber: number | null;
  latencyMs: number;
  error: string | null;
  checkedAt: string;
};

export function statusLabel(status: CaseStatus) {
  return {
    performing: "Performing",
    "breach-active": "Breach active",
    "evidence-filed": "Evidence filed",
    "quorum-ready": "Quorum ready",
    resolved: "Resolved"
  }[status];
}
