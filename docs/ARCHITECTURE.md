# DefaultCourt Architecture

DefaultCourt is a Next.js App Router product with a Portaldot proof boundary.

It is built for a specific credit workflow: a private-credit covenant has failed, an operator has to assemble evidence, guardians need to approve the recovery path, and the desk needs a receipt that can later be written through a Portaldot contract call.

## Runtime Surfaces

| Surface | Purpose |
| --- | --- |
| `/` | Product hook, live Portaldot rail, and entry point for the default room. |
| `/app` | Primary default room for breach, evidence, vote, and resolution. |
| `/app/cases/[id]` | Human-readable receipt and evidence ledger. |
| `/app/guardians` | Guardian quorum drill and approval state. |
| `/app/contract` | Live RPC proof, write readiness, and ink! source. |
| `/about` | Architecture explanation for reviewers. |
| `/api/cases` | Case list backed by local JSON in development and Cloudflare KV in production. |
| `/api/cases/[id]` | Case receipt API. |
| `/api/cases/[id]/event` | Mutates the case through the scripted breach, evidence, vote, and resolution steps. |
| `/api/portaldot/status` | Live Portaldot finalized-head and chain-property read path. |

## Product Flow

1. A reviewer opens `/app`.
2. The page loads a seeded credit case from the persistence layer.
3. The operator triggers the covenant breach.
4. The operator adds an evidence digest.
5. Guardians approve or reject the recovery path.
6. The operator resolves the room.
7. The receipt page shows the case state, evidence, approvals, and Portaldot write readiness.

The flow is deliberately small enough to demonstrate in under a minute, but each step mutates real persisted case state.

## Data Model

`CourtCase` is the central state object.

It stores:

- borrower and lender names,
- facility and collateral context,
- exposure amount,
- case status,
- evidence entries,
- guardian vote records,
- timeline events,
- receipt copy,
- Portaldot write readiness.

The browser never owns the canonical case state. UI controls call route handlers, route handlers load the current case, and the persistence layer writes the next state before the page renders the result.

## Persistence

Local development uses `.defaultcourt-data/cases.json`.

Production uses the `DEFAULTCOURT_CASES` Cloudflare KV namespace through OpenNext's Cloudflare context. The Worker enables this path with:

```json
{
  "DEFAULTCOURT_USE_CLOUDFLARE_KV": "1"
}
```

The same route handlers run in both modes. Development keeps the JSON file so Playwright tests and screenshots can reset to a deterministic ledger. Production keeps the ledger in KV so the deployed Worker survives refreshes and independent requests.

## Portaldot Read Boundary

`src/lib/portaldot.ts` connects to `PORTALDOT_RPC_URL` through WebSocket JSON-RPC.

It reads:

- `chain_getFinalizedHead`,
- `chain_getHeader`,
- `system_properties`.

The app displays the endpoint, finalized head, optional block number, token symbol, decimals, SS58 format, latency, and checked-at timestamp. These values are live network reads, not seeded UI strings.

## Portaldot Write Boundary

The write plan is intentionally separate from the read path.

Real writes require:

- `PORTALDOT_MNEMONIC`, funded with POT,
- `PORTALDOT_CONTRACT_ADDRESS`, after deploying the included ink! contract,
- a server-side call path that signs through the Portaldot Python SDK.

When those values are absent, DefaultCourt shows a readiness state and the receipt says the write is waiting for a funded signer. It does not generate a fake digest, fake transaction hash, or fake contract address.

## Contract Boundary

`contracts/default_court/lib.rs` is the open-source ink! contract.

The contract records:

- case creation,
- stage changes,
- evidence hashes,
- guardian approvals,
- final resolution.

`scripts/portaldot_deploy_contract.py` follows the Portaldot Python SDK flow and refuses to deploy without `PORTALDOT_MNEMONIC`. The script is part of the proof package, but the live submission should not claim a deployed address until the signer is funded and the deployment has been run.

## Cloudflare Boundary

The deployed app uses:

- Cloudflare Workers,
- OpenNext for Cloudflare,
- Workers assets,
- `WORKER_SELF_REFERENCE`,
- `DEFAULTCOURT_CASES` KV,
- `PORTALDOT_RPC_URL` as a Worker variable.

`wrangler.jsonc` is the source of truth for the Worker name, compatibility flags, KV binding, and public RPC variable.

## Security Boundary

- `PORTALDOT_MNEMONIC` is never sent to the browser.
- Client components only call server routes.
- Missing credentials produce an explicit readiness state.
- Raw RPC payloads are not the default reviewer surface.
- The UI presents receipts, timelines, and labels instead of raw JSON dumps.
- Deployment docs list secret names only, never secret values.

## Verification

The current verification path is:

```bash
npm run build
npm run portaldot:status
PLAYWRIGHT_BASE_URL=http://localhost:3012 npm run test:e2e
```

Production smoke checks should cover:

- `/`,
- `/app`,
- `/api/cases`,
- `/api/portaldot/status`.

## Remaining Proof Gap

DefaultCourt has live reads, production persistence, contract source, and deployment scripts.

The remaining chain proof gap is the signed write. Closing it requires a funded Portaldot mnemonic and then a real contract address. Until that happens, the correct product behavior is to keep the write boundary visible and unresolved.
