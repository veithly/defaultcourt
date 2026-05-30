import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { CourtCase, GuardianVote, TimelineEvent } from "./types";

const CASES_KEY = "defaultcourt:cases:v1";

type CasesKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const seedCase: CourtCase = {
  id: "dc-2026-001",
  borrower: "Northstar Receivables SPV",
  lender: "Harbor Credit Pool",
  collateral: "Tokenized invoice pool · May 2026",
  exposureUsd: 1280000,
  dueAt: "2026-05-31T00:00:00.000Z",
  status: "performing",
  recoveryPlan: "Freeze new drawdowns, notify borrower, and approve a seven-day recovery window.",
  evidence: [],
  votes: [],
  timeline: [
    {
      id: "event-origin",
      at: "2026-05-30T08:00:00.000Z",
      label: "Credit case opened",
      detail: "The invoice pool entered DefaultCourt monitoring before the covenant deadline.",
      actor: "Harbor Credit Pool"
    }
  ],
  receiptText: "Resolution is waiting for breach, evidence, guardian quorum, and recovery approval.",
  updatedAt: "2026-05-30T08:00:00.000Z"
};

function dataDir() {
  return path.resolve(process.cwd(), process.env.DEFAULTCOURT_DATA_DIR || ".defaultcourt-data");
}

function casesFile() {
  return path.join(dataDir(), "cases.json");
}

async function casesKv(): Promise<CasesKv | null> {
  if (process.env.DEFAULTCOURT_USE_CLOUDFLARE_KV !== "1") return null;

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    return (context.env as CloudflareEnv & { DEFAULTCOURT_CASES?: CasesKv }).DEFAULTCOURT_CASES ?? null;
  } catch {
    return null;
  }
}

async function ensureStore() {
  await mkdir(dataDir(), { recursive: true });
  if (!existsSync(casesFile())) {
    await writeFile(casesFile(), JSON.stringify([seedCase], null, 2), "utf8");
  }
}

export async function listCases(): Promise<CourtCase[]> {
  const kv = await casesKv();
  if (kv) {
    const raw = await kv.get(CASES_KEY);
    if (raw) return JSON.parse(raw) as CourtCase[];
    const freshCases = [structuredClone(seedCase)];
    await kv.put(CASES_KEY, JSON.stringify(freshCases, null, 2));
    return freshCases;
  }

  await ensureStore();
  const raw = await readFile(casesFile(), "utf8");
  return JSON.parse(raw) as CourtCase[];
}

export async function getCase(id: string): Promise<CourtCase | null> {
  const cases = await listCases();
  return cases.find((item) => item.id === id) ?? null;
}

async function saveCases(cases: CourtCase[]) {
  const kv = await casesKv();
  if (kv) {
    await kv.put(CASES_KEY, JSON.stringify(cases, null, 2));
    return;
  }

  await ensureStore();
  await writeFile(casesFile(), JSON.stringify(cases, null, 2), "utf8");
}

export async function resetCases(): Promise<CourtCase[]> {
  const freshCases = [structuredClone(seedCase)];
  const kv = await casesKv();
  if (kv) {
    await kv.put(CASES_KEY, JSON.stringify(freshCases, null, 2));
    return freshCases;
  }

  await mkdir(dataDir(), { recursive: true });
  await writeFile(casesFile(), JSON.stringify(freshCases, null, 2), "utf8");
  return freshCases;
}

function event(label: string, detail: string, actor: string): TimelineEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    label,
    detail,
    actor
  };
}

export async function advanceCase(id: string, action: "breach" | "evidence" | "vote" | "resolve") {
  const cases = await listCases();
  const index = cases.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const current = cases[index];
  let next: CourtCase = { ...current, updatedAt: new Date().toISOString() };

  if (action === "breach") {
    next = {
      ...next,
      status: "breach-active",
      timeline: [
        ...next.timeline,
        event("Covenant breach triggered", "The reporting covenant missed its deadline and started the default clock.", "Credit operator")
      ]
    };
  }

  if (action === "evidence") {
    const item = {
      id: `ev-${Date.now()}`,
      label: "Borrower reporting gap",
      hash: "bafy-defaultcourt-evidence-reporting-gap",
      source: "Operator-entered evidence digest",
      at: new Date().toISOString()
    };
    next = {
      ...next,
      status: "evidence-filed",
      evidence: [...next.evidence, item],
      timeline: [
        ...next.timeline,
        event("Evidence attached", "A covenant evidence digest was attached to the case timeline.", "Credit operator")
      ]
    };
  }

  if (action === "vote") {
    const existing = new Set(next.votes.map((vote) => vote.guardian));
    const guardian = ["Aster", "Banyan", "Cedar"].find((name) => !existing.has(name)) ?? "Aster";
    const vote: GuardianVote = { guardian, decision: "approve", at: new Date().toISOString() };
    const votes = [...next.votes, vote];
    next = {
      ...next,
      votes,
      status: votes.filter((item) => item.decision === "approve").length >= 2 ? "quorum-ready" : next.status,
      timeline: [
        ...next.timeline,
        event("Guardian approved recovery", `${guardian} approved the recovery plan.`, "Guardian")
      ]
    };
  }

  if (action === "resolve") {
    const receipt = [
      "DefaultCourt receipt",
      `Case: ${next.id}`,
      `Borrower: ${next.borrower}`,
      `Evidence items: ${next.evidence.length}`,
      `Approvals: ${next.votes.filter((vote) => vote.decision === "approve").length}/3`,
      "Portaldot write: ready for the wallet + contract desk"
    ].join("\\n");
    next = {
      ...next,
      status: "resolved",
      receiptText: receipt,
      timeline: [
        ...next.timeline,
        event("Recovery resolution closed", "Guardian quorum approved the recovery plan. The wallet + contract desk can now submit the Portaldot contract call.", "Credit operator")
      ]
    };
  }

  cases[index] = next;
  await saveCases(cases);
  return next;
}
