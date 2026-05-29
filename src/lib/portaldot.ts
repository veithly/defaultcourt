import type { ChainStatus } from "./types";

const DEFAULT_ENDPOINT = "wss://mainnet.portaldot.io";

async function createRpcSocket(endpoint: string): Promise<WebSocket> {
  if (typeof WebSocket !== "undefined") {
    return new WebSocket(endpoint);
  }

  const { default: NodeWebSocket } = await import("ws");
  return new NodeWebSocket(endpoint) as unknown as WebSocket;
}

async function rpcCall(endpoint: string, method: string, params: unknown[] = [], timeoutMs = 4500): Promise<unknown> {
  const ws = await createRpcSocket(endpoint);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`Portaldot RPC timeout for ${method}`));
    }, timeoutMs);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }));
    };

    ws.onmessage = (event) => {
      clearTimeout(timer);
      ws.close();
      const payload = JSON.parse(String(event.data));
      if (payload.error) reject(new Error(payload.error.message || "Portaldot RPC returned an error"));
      else resolve(payload.result);
    };

    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Portaldot RPC socket failed for ${method}`));
    };
  });
}

export async function getPortaldotStatus(): Promise<ChainStatus> {
  const endpoint = process.env.PORTALDOT_RPC_URL || DEFAULT_ENDPOINT;
  const started = Date.now();
  try {
    const [head, properties] = await Promise.all([
      rpcCall(endpoint, "chain_getFinalizedHead"),
      rpcCall(endpoint, "system_properties")
    ]);
    let blockNumber: number | null = null;
    try {
      const header = await rpcCall(endpoint, "chain_getHeader", [head]);
      const number = (header as { number?: string }).number;
      blockNumber = number ? Number.parseInt(number, 16) : null;
    } catch {
      blockNumber = null;
    }
    const props = properties as { tokenSymbol?: string | string[]; tokenDecimals?: number | number[]; ss58Format?: number };
    const tokenValue = Array.isArray(props.tokenSymbol) ? props.tokenSymbol[0] : props.tokenSymbol;
    const decimalsValue = Array.isArray(props.tokenDecimals) ? props.tokenDecimals[0] : props.tokenDecimals;
    return {
      ok: true,
      endpoint,
      chain: "Portaldot",
      token: tokenValue || "POT",
      decimals: decimalsValue ?? 14,
      ss58Format: props.ss58Format ?? 42,
      finalizedHead: String(head),
      blockNumber,
      latencyMs: Date.now() - started,
      error: null,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      endpoint,
      chain: "Portaldot",
      token: "POT",
      decimals: 14,
      ss58Format: 42,
      finalizedHead: null,
      blockNumber: null,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Unknown Portaldot RPC error",
      checkedAt: new Date().toISOString()
    };
  }
}

export function sendTransactionPlan() {
  return {
    method: "Contracts.call through Portaldot Python SDK",
    signer: "PORTALDOT_MNEMONIC",
    readiness: Boolean(process.env.PORTALDOT_MNEMONIC),
    contractAddress: process.env.PORTALDOT_CONTRACT_ADDRESS || null
  };
}
