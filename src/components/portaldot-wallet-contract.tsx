"use client";

import { useMemo, useState } from "react";

type Readiness = {
  ok: boolean;
  endpoint: string;
  signerConfigured: boolean;
  signerAddress: string | null;
  contractAddress: string | null;
  metadataReady: boolean;
  missing: string[];
};

type WalletAccount = {
  address: string;
  meta?: { name?: string; source?: string };
};

type TxResult = {
  ok: boolean;
  txHash?: string;
  blockHash?: string | null;
  status?: string;
  events?: string[];
  error?: string;
};

export function PortaldotWalletContract({ initialReadiness }: { initialReadiness: Readiness }) {
  const [readiness, setReadiness] = useState(initialReadiness);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [selected, setSelected] = useState("");
  const [walletMessage, setWalletMessage] = useState("No browser wallet connected yet.");
  const [txMessage, setTxMessage] = useState("");
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const missing = useMemo(() => readiness.missing.join(", ") || "none", [readiness.missing]);

  async function refreshStatus() {
    const res = await fetch("/api/portaldot/contract/status", { cache: "no-store" });
    const next = (await res.json()) as Readiness;
    setReadiness(next);
  }

  async function connectBrowserWallet() {
    setBusy("wallet");
    setWalletMessage("Opening Polkadot wallet extension...");
    try {
      const { web3Accounts, web3Enable } = await import("@polkadot/extension-dapp");
      const extensions = await web3Enable("DefaultCourt");
      if (extensions.length === 0) {
        setWalletMessage("No Polkadot-compatible browser extension approved DefaultCourt.");
        return;
      }
      const nextAccounts = (await web3Accounts()) as WalletAccount[];
      setAccounts(nextAccounts);
      setSelected(nextAccounts[0]?.address ?? "");
      setWalletMessage(nextAccounts.length ? `${nextAccounts.length} wallet account(s) available for signing.` : "Extension connected, but no account is exposed.");
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setBusy(null);
    }
  }

  async function callWithServerSigner() {
    setBusy("server");
    setTxMessage("Submitting contract write through the funded server signer...");
    setTxResult(null);
    try {
      const res = await fetch("/api/portaldot/contract/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: 1 })
      });
      const result = (await res.json()) as TxResult;
      setTxResult(result);
      setTxMessage(result.ok ? `Submitted ${result.txHash}` : result.error ?? "Contract write is not ready.");
      await refreshStatus();
    } catch (error) {
      setTxMessage(error instanceof Error ? error.message : "Contract write failed.");
    } finally {
      setBusy(null);
    }
  }

  async function callWithBrowserWallet() {
    if (!selected) {
      setTxMessage("Connect and select a browser wallet account first.");
      return;
    }
    if (!readiness.contractAddress || !readiness.metadataReady) {
      setTxMessage("Browser-wallet contract calls need a deployed contract address and compiled ink! metadata.");
      return;
    }

    setBusy("browser-contract");
    setTxMessage("Waiting for wallet signature on resolve_case(1)...");
    setTxResult(null);
    try {
      const [{ web3FromAddress }, { ApiPromise, WsProvider }, { ContractPromise }] = await Promise.all([
        import("@polkadot/extension-dapp"),
        import("@polkadot/api"),
        import("@polkadot/api-contract")
      ]);
      const injector = await web3FromAddress(selected);
      const provider = new WsProvider(readiness.endpoint);
      const api = await ApiPromise.create({ provider });
      api.setSigner(injector.signer);
      const metadata = await fetch("/api/portaldot/contract/metadata", { cache: "no-store" }).then((res) => {
        if (!res.ok) throw new Error("Compiled ink! metadata is missing.");
        return res.json();
      });
      const contract = new ContractPromise(api, metadata, readiness.contractAddress);
      const gasLimit = api.registry.createType("WeightV2", {
        refTime: "50000000000",
        proofSize: "200000"
      });
      const tx = contract.tx.resolveCase({ gasLimit: gasLimit as never, storageDepositLimit: null }, 1);
      const txHash = tx.hash.toHex();

      const result = await new Promise<TxResult>((resolve, reject) => {
        void tx.signAndSend(selected, (update) => {
          if (update.dispatchError) {
            reject(new Error(update.dispatchError.toString()));
            return;
          }
          if (update.status.isInBlock || update.status.isFinalized) {
            resolve({
              ok: true,
              txHash,
              blockHash: update.status.isInBlock ? update.status.asInBlock.toHex() : update.status.asFinalized.toHex(),
              status: update.status.type,
              events: update.events.map(({ event }) => `${event.section}.${event.method}`)
            });
          }
        }).catch(reject);
      });

      await api.disconnect();
      setTxResult(result);
      setTxMessage(`Browser wallet submitted ${result.txHash}`);
    } catch (error) {
      setTxMessage(error instanceof Error ? error.message : "Browser wallet contract call failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="panel p-5">
        <div className="news-label">Wallet + contract interaction</div>
        <h2 className="mt-3 text-3xl font-black">Real signing path, no fake receipt.</h2>
        <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
          <p>Endpoint: <span className="text-[var(--paper)]">{readiness.endpoint}</span></p>
          <p>Funded server signer: <span className="text-[var(--paper)]">{readiness.signerAddress ?? "not configured"}</span></p>
          <p>Contract address: <span className="text-[var(--paper)]">{readiness.contractAddress ?? "not deployed"}</span></p>
          <p>Compiled metadata: <span className="text-[var(--paper)]">{readiness.metadataReady ? "ready" : "missing"}</span></p>
          <p>Missing gate: <span className="text-[var(--danger)]">{missing}</span></p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button className="sharp-button secondary focus-ring" disabled={busy !== null} onClick={connectBrowserWallet}>
            {busy === "wallet" ? "Connecting..." : "Connect browser wallet"}
          </button>
          <button className="sharp-button secondary focus-ring" disabled={busy !== null || !selected} onClick={callWithBrowserWallet}>
            {busy === "browser-contract" ? "Signing..." : "Call contract with wallet"}
          </button>
          <button className="sharp-button success focus-ring" disabled={busy !== null} onClick={callWithServerSigner}>
            {busy === "server" ? "Writing..." : "Use funded demo signer"}
          </button>
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">{walletMessage}</p>
        {accounts.length > 0 ? (
          <label className="mt-4 block text-sm text-[var(--muted)]">
            Signing account
            <select className="mt-2 w-full border border-[var(--line)] bg-black/30 p-3 text-[var(--paper)]" value={selected} onChange={(event) => setSelected(event.target.value)}>
              {accounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {account.meta?.name ?? "Wallet account"} · {account.address}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {txMessage ? <p className="mt-4 text-sm text-[var(--paper)]">{txMessage}</p> : null}
        {txResult?.ok ? (
          <div className="mt-4 border border-[var(--line)] bg-black/25 p-4 text-sm">
            <div className="news-label">On-chain receipt</div>
            <p className="mt-2 overflow-wrap-anywhere">Tx hash: {txResult.txHash}</p>
            <p className="mt-2 overflow-wrap-anywhere">Block: {txResult.blockHash}</p>
            <p className="mt-2">Status: {txResult.status}</p>
            <p className="mt-2">Events: {txResult.events?.join(", ")}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
