"""Deploy or call DefaultCourt through the Portaldot Python SDK.

This script intentionally refuses to run writes without PORTALDOT_MNEMONIC.
It follows the Portaldot docs pattern for substrateinterface + ink! contracts.
"""

import os
import sys
from pathlib import Path

RPC_URL = os.getenv("PORTALDOT_RPC_URL", "wss://mainnet.portaldot.io")
MNEMONIC = os.getenv("PORTALDOT_MNEMONIC")


def main() -> int:
    if not MNEMONIC:
        print("PORTALDOT_MNEMONIC is required for real contract deployment/calls.")
        print("Generate a throwaway Portaldot/Substrate account, fund it with POT, then export PORTALDOT_MNEMONIC.")
        return 2

    try:
        from substrateinterface import Keypair, SubstrateInterface
        from substrateinterface.contracts import ContractCode
    except Exception as exc:
        print("Missing Python dependency. Install with: pip install substrate-interface")
        print(exc)
        return 2

    root = Path(__file__).resolve().parents[1]
    metadata = root / "contracts" / "default_court" / "target" / "ink" / "default_court.json"
    wasm = root / "contracts" / "default_court" / "target" / "ink" / "default_court.wasm"
    if not metadata.exists() or not wasm.exists():
        print("Compiled ink! artifacts are missing.")
        print("Build them with cargo-contract in contracts/default_court before deploying.")
        print(f"Expected: {metadata}")
        print(f"Expected: {wasm}")
        return 2

    portaldot = SubstrateInterface(url=RPC_URL, ss58_format=42, type_registry_preset="default")
    keypair = Keypair.create_from_uri(MNEMONIC, ss58_format=42)
    code = ContractCode.create_from_contract_files(metadata_file=str(metadata), wasm_file=str(wasm), portaldot=portaldot)
    contract = code.deploy(
        keypair=keypair,
        constructor="new",
        args={},
        value=0,
        gas_limit={"ref_time": 25990000000, "proof_size": 11990383647911208550},
        upload_code=True,
    )
    print(f"Deployed DefaultCourt @ {contract.contract_address}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

