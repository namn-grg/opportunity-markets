# Opportunity Markets

Private, sponsor-seeded prediction markets where scouts buy YES against a constant-product AMM while prices and positions stay dark on Oasis Sapphire.

- **Constant-product YES AMM** with sponsor-only liquidity, penalties on NO, and slippage-checked buys; see `smart-contracts/src/OpportunityMarket.sol`.
- **Factory + metadata** keeps market listings lightweight and seeded by sponsors; see `smart-contracts/src/OpportunityFactory.sol`.
- **Calm frontend** in `frontend/` (Next.js 14 + Tailwind + RainbowKit/Wagmi/Viem) with market directory, trading workspace, and sponsor wizard that hashes questions/options client-side before calling the factory.
- **ROFL/Sapphire ready** via `rofl.yaml` + `compose.yaml`, so the app can run inside a TEE with confidential storage/execution.

## Repository layout
- `frontend/` – Next.js app, components, and static demo data (see `frontend/README.md`).
- `smart-contracts/` – Foundry workspace with contracts, tests, and deployment script.
- `compose.yaml` – container spec used by ROFL builds.
- `rofl.yaml` – Oasis ROFL manifest targeting Sapphire testnet (TEE artifacts + policy).
- `env.sample` – environment variables consumed by the frontend build/runtime.

## Quickstart
1. Copy environment defaults:
   ```bash
   cp env.sample .env
   ```
   Set `NEXT_PUBLIC_SAPPHIRE_RPC`, `NEXT_PUBLIC_FACTORY_ADDRESS`, and `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`. Keep `NEXT_PUBLIC_DEMO_MODE=true` to run offline with seeded markets.
2. Install dependencies and run the app:
   ```bash
   cd frontend
   yarn install
   yarn dev
   ```
   Visit `http://localhost:3000`. The trading workspace uses demo data unless you point it at a live factory.

## Smart contracts (Foundry)
```bash
cd smart-contracts
forge install        # grabs dependencies if not vendored
forge test           # runs specs under test/
```

- Core market logic: `smart-contracts/src/OpportunityMarket.sol` (constant-product pricing, sponsor-only liquidity, lock/resolve lifecycle, penalty handling).
- Factory: `smart-contracts/src/OpportunityFactory.sol` (deploys markets, wires sponsor collateral on creation).
- Deployment helper: `smart-contracts/script/Deploy.s.sol` (expects `PRIVATE_KEY`, `SAPPHIRE_RPC`, `COLLATERAL_TOKEN`).

Example deploy:
```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SAPPHIRE_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## ROFL / Sapphire
- `rofl.yaml` sets `paratime: sapphire` and TEE artifacts for confidential execution.
- `compose.yaml` points to the frontend container image for ROFL bundling.
- Follow `ROFL.md` to build an `.orc` bundle, set secrets (RPC, factory address), and deploy a ROFL machine.

## Notes
- Demo mode mirrors the flow with localStorage to avoid RPC dependencies.
- The contracts avoid emitting priceful events to keep order flow private; confidentiality is delegated to Sapphire’s runtime.
- Tailor CPU/memory/storage in `rofl.yaml` as you scale.
