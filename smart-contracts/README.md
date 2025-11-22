## Opportunity Markets (Foundry)

This workspace implements the hackathon MVP described in `PLAN.md`: a sponsor-seeded, privacy-preserving prediction market where traders only buy YES exposure from a constant-product AMM. Oasis Sapphire handles storage confidentiality; the contracts focus on limiting price leakage, enforcing penalties, and enabling future ROFL integrations.

### Contracts

- `OpportunityMarket.sol`: single-market AMM with slippage-checked YES buys, lock/resolve lifecycle, penalty/refund accounting, and sponsor payout controls.
- `OpportunityFactory.sol`: ownable deployer that seeds new markets, records metadata, and enforces sponsor approvals.
- `IOpportunityMarket.sol`: shared interface for front-ends and ROFL agents.

See `test/` for Foundry specs covering swaps, slippage, resolution flows, sponsor policies, and factory behavior. A lightweight deployment helper lives at `script/Deploy.s.sol` (expects `PRIVATE_KEY` and Sapphire RPC URL).

### Quickstart

```shell
forge install
forge build
forge test
```

### Deployment

```shell
forge script script/Deploy.s.sol:Deploy --rpc-url $SAPPHIRE_RPC --private-key $PRIVATE_KEY --broadcast
```

Review the broader product scope and prompting tips in `PLAN.md` when extending the system (adding ROFL orchestration, invariant tests, etc.). Foundry docs: https://book.getfoundry.sh/
