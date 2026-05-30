import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_ENDPOINT = "wss://mainnet.portaldot.io";
const DEFAULT_METADATA_PATH = "contracts/default_court/target/ink/default_court.json";

export type PortaldotContractReadiness = {
  ok: boolean;
  endpoint: string;
  signerConfigured: boolean;
  signerAddress: string | null;
  contractAddress: string | null;
  metadataPath: string;
  metadataReady: boolean;
  missing: string[];
};

export function contractMetadataPath() {
  return path.resolve(process.cwd(), process.env.PORTALDOT_CONTRACT_METADATA_PATH || DEFAULT_METADATA_PATH);
}

export async function readContractMetadata() {
  return JSON.parse(await readFile(contractMetadataPath(), "utf8")) as unknown;
}

export async function getContractReadiness(): Promise<PortaldotContractReadiness> {
  const endpoint = process.env.PORTALDOT_RPC_URL || DEFAULT_ENDPOINT;
  const metadataPath = contractMetadataPath();
  const missing: string[] = [];
  const mnemonic = process.env.PORTALDOT_MNEMONIC;
  const contractAddress = process.env.PORTALDOT_CONTRACT_ADDRESS || null;
  const metadataReady = existsSync(metadataPath);
  let signerAddress: string | null = null;

  if (!mnemonic) missing.push("PORTALDOT_MNEMONIC");
  if (!contractAddress) missing.push("PORTALDOT_CONTRACT_ADDRESS");
  if (!metadataReady) missing.push("PORTALDOT_CONTRACT_METADATA_PATH");

  if (mnemonic) {
    try {
      const [{ Keyring }, { cryptoWaitReady }] = await Promise.all([
        import("@polkadot/keyring"),
        import("@polkadot/util-crypto")
      ]);
      await cryptoWaitReady();
      const keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
      signerAddress = keyring.addFromUri(mnemonic).address;
    } catch {
      missing.push("valid PORTALDOT_MNEMONIC");
    }
  }

  return {
    ok: missing.length === 0,
    endpoint,
    signerConfigured: Boolean(mnemonic),
    signerAddress,
    contractAddress,
    metadataPath,
    metadataReady,
    missing
  };
}

export async function writeResolvedCaseOnPortaldot(caseId = 1) {
  const readiness = await getContractReadiness();
  if (!readiness.ok) {
    return {
      ok: false,
      readiness,
      error: `Cannot submit a real Portaldot contract write. Missing: ${readiness.missing.join(", ")}`
    };
  }

  const [{ ApiPromise, WsProvider }, { ContractPromise }, { Keyring }, { cryptoWaitReady }] = await Promise.all([
    import("@polkadot/api"),
    import("@polkadot/api-contract"),
    import("@polkadot/keyring"),
    import("@polkadot/util-crypto")
  ]);

  await cryptoWaitReady();
  const provider = new WsProvider(readiness.endpoint);
  const api = await ApiPromise.create({ provider });

  try {
    const metadata = await readContractMetadata();
    const keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
    const signer = keyring.addFromUri(process.env.PORTALDOT_MNEMONIC!);
    const contract = new ContractPromise(api, metadata as never, readiness.contractAddress!);
    const gasLimit = api.registry.createType("WeightV2", {
      refTime: "50000000000",
      proofSize: "200000"
    });

    const tx = contract.tx.resolveCase({ gasLimit: gasLimit as never, storageDepositLimit: null }, caseId);
    const txHash = tx.hash.toHex();

    const result = await new Promise<{ txHash: string; blockHash: string | null; status: string; events: string[] }>((resolve, reject) => {
      let settled = false;
      void tx.signAndSend(signer, (update) => {
        if (update.dispatchError) {
          settled = true;
          reject(new Error(update.dispatchError.toString()));
          return;
        }

        if (update.status.isInBlock || update.status.isFinalized) {
          settled = true;
          resolve({
            txHash,
            blockHash: update.status.isInBlock ? update.status.asInBlock.toHex() : update.status.asFinalized.toHex(),
            status: update.status.type,
            events: update.events.map(({ event }) => `${event.section}.${event.method}`)
          });
        }
      }).catch((error) => {
        if (!settled) reject(error);
      });
    });

    return {
      ok: true,
      readiness,
      caseId,
      ...result,
      checkedAt: new Date().toISOString()
    };
  } finally {
    await api.disconnect();
  }
}
