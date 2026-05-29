# Deployment

DefaultCourt is Cloudflare-first.

## Local

```bash
npm install
npm run build
npm run start
```

The default read-only RPC endpoint is configured in code and `wrangler.jsonc`. Create `.env.local` only for local overrides or funded write credentials.

## Environment Variables

| Name | Required | Purpose |
| --- | --- | --- |
| `PORTALDOT_RPC_URL` | Yes | Portaldot RPC, defaults to `wss://mainnet.portaldot.io`. |
| `PORTALDOT_MNEMONIC` | Only for writes | Funded throwaway mnemonic for real contract deploy/call. |
| `PORTALDOT_CONTRACT_ADDRESS` | After deploy | Existing DefaultCourt contract address. |
| `DEFAULTCOURT_USE_CLOUDFLARE_KV` | Production | Set to `1` so route handlers use the `DEFAULTCOURT_CASES` KV binding. |
| `DEFAULTCOURT_DATA_DIR` | Local fallback | Local JSON ledger directory for development and tests. |

## Cloudflare Plan

DefaultCourt deploys with OpenNext for Cloudflare Workers.

```bash
npm run deploy
```

Production URL:

```text
https://defaultcourt.veithly.workers.dev
```

Bindings:

| Binding | Type | Purpose |
| --- | --- | --- |
| `DEFAULTCOURT_CASES` | KV | Production case ledger for breach/evidence/vote/receipt state. |
| `ASSETS` | Workers assets | OpenNext static assets. |
| `WORKER_SELF_REFERENCE` | Service binding | OpenNext self-reference binding. |

Store `PORTALDOT_MNEMONIC` only as a server-side Worker secret when write routes are enabled.

Do not store `PORTALDOT_MNEMONIC` in `wrangler.jsonc`, browser-visible code, screenshots, deck files, or submission copy.

## Public Worker State

`wrangler.jsonc` currently declares:

```text
name = defaultcourt
main = .open-next/worker.js
KV = DEFAULTCOURT_CASES
PORTALDOT_RPC_URL = wss://mainnet.portaldot.io
DEFAULTCOURT_USE_CLOUDFLARE_KV = 1
```

The Cloudflare KV namespace stores the case ledger in production. Local development still uses `.defaultcourt-data/cases.json`.

## Smoke Test

```bash
npm run build
npm run portaldot:status
npm run test:e2e
curl -I https://defaultcourt.veithly.workers.dev/
curl -I https://defaultcourt.veithly.workers.dev/app
curl https://defaultcourt.veithly.workers.dev/api/cases
curl https://defaultcourt.veithly.workers.dev/api/portaldot/status
```

Last production smoke: 2026-05-29T19:54:16Z. The Worker returned HTTP 200 for `/` and `/app`; `/api/cases` returned the seeded case from `DEFAULTCOURT_CASES`; `/api/portaldot/status` returned live Portaldot finalized-head data.

## Write-Proof Gate

The deployment is not allowed to claim a Portaldot contract write until these steps are true:

1. `PORTALDOT_MNEMONIC` is funded with POT.
2. The ink! contract is deployed from `contracts/default_court/lib.rs`.
3. `PORTALDOT_CONTRACT_ADDRESS` is set from the real deployment output.
4. A recovery-room write is submitted through the Portaldot SDK.
5. The receipt page and submission copy include the real address and proof.
