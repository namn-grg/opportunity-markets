Here is a concrete, LLM-friendly implementation plan you can follow with Foundry + Oasis Sapphire.

---

0. Goal + Scope for the MVP

Target for the hackathon MVP:
	•	Single sponsor-driven “family” of private markets (e.g., “Will we sign Artist X in 2025?”).
	•	Sponsor is the only LP.
	•	Traders buy YES claims from the sponsor via an AMM-like curve.
	•	Price is “dark” in the sense that:
	•	No explicit price events/logs.
	•	State is confidential at the protocol level thanks to Sapphire.
	•	Resolution:
	•	If YES: YES holders are paid from sponsor collateral.
	•	If NO: traders lose a configurable fraction of their stake (penaltyBps), which is transferred to sponsor; the remainder is refunded to traders.
	•	Traders specify a price range via slippage parameters:
	•	MVP: standard AMM “maxPrice / minPrice” semantics instead of full bid bands.

Everything else (ROFL agent, opportunity window logic, UI) can be layered on later.

---

1. System Architecture

1.1 Core components

For the hackathon, keep it minimal and composable:
	1.	OpportunityFactory
	•	Creates markets.
	•	Tracks list of markets and their metadata.
	2.	OpportunityMarket
	•	One instance per “Will we sign X?” market.
	•	Handles AMM pricing, trader positions, resolution, and payout.
	3.	IOpportunityMarket interface
	•	Clean interface for front-end and optional ROFL integration.
	4.	CollateralToken
	•	Use an existing ERC20 on Sapphire testnet (e.g., test ROSE wrapper) or a simple mock ERC20 for local dev.

1.2 Optional later: ROFL service (off-chain logic in TEE)
	•	A ROFL app can:
	•	Handle order batching and timing (opportunity window).
	•	Talk to OpportunityFactory / OpportunityMarket via Sapphire.
	•	For MVP, design the contracts so you can later plug ROFL in without changing core interfaces.

---

2. Economic Model & Math (MVP)

2.1 Basic YES share model
	•	Each YES share pays out 1 * UNIT of collateral if the outcome is YES.
	•	AMM price p is in [pMin, pMax] ⊆ (0, 1).
	•	Sponsor provides initial liquidity:
	•	Conceptually: pool of “YES” (virtual) and collateral (real).
	•	Use an LMSR-ish or constant-product curve for simplicity.

MVP suggestion: constant product AMM with sponsor as the sole counterparty.
	•	Let:
	•	R_c = collateral reserve
	•	R_y = virtual YES reserve
	•	Price of YES in collateral terms ~ R_c / R_y.
	•	When trader buys Δy YES:
	•	They pay Δc such that (R_c + Δc) * (R_y - Δy) = k (constant).
	•	Implement standard x*y=k swap math.

2.2 Slippage-based “range”
	•	Trader passes:
	•	maxPrice in collateral per YES for buys.
	•	minPrice in collateral per YES for sells (if you implement selling).
	•	The contract computes effective price of the trade and reverts if:
	•	effectivePrice > maxPrice (buy).
	•	effectivePrice < minPrice (sell).
	•	This gives you a bid range without implementing complex hidden orderbooks.

2.3 NO outcome penalty

Config at market creation:
	•	penaltyBps in [0, 10_000].

On resolution:
	•	If YES:
	•	Each YES share claims UNIT collateral.
	•	Sponsor’s collateral is reduced accordingly.
	•	If NO:
	•	For each trader:
	•	Let stake be their total collateral spent (cost basis).
	•	penalty = stake * penaltyBps / 10_000.
	•	refund = stake - penalty.
	•	Trader can claim refund.
	•	Sponsor can claim aggregated penalty from the pool.

For MVP, track per-trader:
	•	yesShares[trader]
	•	stakeAmount[trader]

You can refine later (e.g., allow partial sells, dynamic cost basis) if time.

---

3. Contract Design (Per LLM)

Give the LLM clear specs like this when asking it to write code.

3.1 OpportunityFactory

Responsibilities:
	•	Store struct MarketConfig:
	•	address market
	•	address sponsor
	•	address collateralToken
	•	uint16 penaltyBps
	•	uint256 opportunityWindowEnd (timestamp; optional to enforce).
	•	string question or bytes32 questionHash.
	•	function createMarket(CreateParams memory params) external returns (address);
	•	Emit MarketCreated event.

Guidelines for the LLM:
	•	Use Solidity ^0.8.20.
	•	Use custom errors instead of require strings where possible.
	•	Make factory Ownable or allow multiple trusted sponsors (depending on your UX).
	•	Keep question text off-chain; store bytes32 questionHash and keep full text in metadata.

3.2 OpportunityMarket

Core parameters:
	•	address public sponsor;
	•	IERC20 public collateral;
	•	uint16 public penaltyBps;
	•	uint256 public opportunityWindowEnd; (optional)
	•	AMM state:
	•	uint256 public reserveCollateral;
	•	uint256 public reserveYes; (virtual)
	•	uint256 public k; (constant product; or derive)
	•	Accounting:
	•	mapping(address => uint256) public yesBalance;
	•	mapping(address => uint256) public stakeAmount;
	•	Lifecycle:
	•	enum State { Trading, Locked, ResolvedYes, ResolvedNo }
	•	State public state;

Core functions:
	•	constructor(...)
	•	buyYes(uint256 collateralIn, uint256 minYesOut, uint256 maxPrice) external
	•	Pull collateral from trader.
	•	Compute ΔYES with constant product math.
	•	Check effective price ≤ maxPrice.
	•	Update reserves, yesBalance, stakeAmount.
	•	Optional: sellYes(uint256 yesIn, uint256 minCollateralOut, uint256 minPrice) external.
	•	lock() (onlySponsor)
	•	After opportunity window end: stop trading.
	•	resolveYes() / resolveNo() (onlySponsor or oracle role)
	•	Set state.
	•	claimYes():
	•	If ResolvedYes: pay yesBalance[user] * UNIT.
	•	claimNo():
	•	If ResolvedNo: compute refund from stakeAmount[user] and penaltyBps.
	•	claimSponsorPayout():
	•	Sponsor claims penalty pool and residual liquidity.

Security and invariants:
	•	Reentrancy guard on state-changing functions.
	•	Invariants to test:
	•	Reserves never go negative.
	•	Sum of trader claims + sponsor claims ≤ total collateral put in.
	•	penaltyBps <= 10_000.

When prompting LLM, specify:
	•	Do not emit events leaking prices if you want to lean into “dark market” behavior.
	•	If you do emit events, only emit aggregate volumes or hashed orders.

---

4. Sapphire / Confidentiality Considerations

How to lean on Sapphire for privacy without changing Solidity much:
	•	Storage encryption, transaction confidentiality, and enclave execution are handled by Sapphire’s ParaTime.
	•	In your code:
	•	Avoid emitting detailed events with per-trade price/size.
	•	Avoid exposing sensitive per-trader data via public getters; use view functions that return aggregated or filtered views.
	•	Networking:
	•	Use Sapphire RPC endpoints from Foundry (forge test / cast with --rpc-url).
	•	Later, you can add:
	•	Randomness or attestation integration if needed, using Sapphire’s specific precompiles / tooling.

When you instruct the LLM:
	•	Tell it “assume standard EVM; privacy is handled by Sapphire; just don’t leak data via events unnecessarily.”

---

5. Foundry Project Setup

For the LLM, give explicit project scaffolding:
	1.	Init repo:

forge init opportunity-markets
cd opportunity-markets

	2.	Add dependencies:

	•	forge-std for testing.
	•	openzeppelin-contracts for ERC20, Ownable, ReentrancyGuard.

Example foundry.toml hints for LLM:
	•	Use remappings:
	•	@openzeppelin/=lib/openzeppelin-contracts/
	•	forge-std/=lib/forge-std/src/

	3.	Ask LLM to:

	•	Generate base contracts in src/.
	•	Generate tests in test/.
	•	Add a simple deployment script in script/Deploy.s.sol targeting Oasis Sapphire RPC.

You can reference common Foundry patterns and cheat sheets for prompts.

---

6. Testing Plan (for Foundry + LLM)

Tell the LLM to write tests in this order.

6.1 Unit tests for mechanics
	•	OpportunityMarket.t.sol:
	•	testBuyYesUpdatesReservesAndBalances()
	•	testBuyYesRespectsMaxPrice()
	•	testLockStopsTrading()
	•	testResolveYesPayouts()
	•	testResolveNoPenaltyAndRefund()
	•	testSponsorCannotExceedPenaltyBps()

Use Foundry cheatcodes:
	•	vm.prank, vm.expectRevert, vm.warp, vm.deal (if using ETH wrapper).

6.2 Invariant/fuzz tests (if time)
	•	Invariant: total collateral out ≤ total collateral in.
	•	Fuzz buyYes with random users, amounts, and slippage to check for no reverts / broken invariants.

Prompt LLM:
	•	“Write invariant tests in Foundry that track totalCollateralIn and totalCollateralOut and assert no overpayment.”

---

7. Handling “Bid Range vs Slippage”

Implementation strategy:
	1.	MVP:
	•	Only slippage-based trades (maxPrice/minPrice).
	•	So the LLM only implements standard AMM swap with slippage.
	2.	Optional advanced:
	•	Add per-order minPrice/maxPrice stored internally.
	•	For “darkness,” do not expose those orders via events.
	•	You can batch-fill orders in a future ROFL-based matching engine if you have time.

Instruction to LLM:
	•	“For v1 of the contracts, ignore explicit bid bands; treat the user’s maxPrice/minPrice as the only range constraint and revert if the computed execution price is outside that range.”

---

8. Anti-Exploitation Hooks

You probably will not fully solve sponsor self-dealing in a weekend, but you can demonstrate awareness:
	•	Add a config flag:
	•	bool public sponsorCanTrade;
	•	If set to false:
	•	Enforce require(msg.sender != sponsor) in buyYes / sellYes.
	•	Add a SponsorPolicy struct and emit one event at market creation describing:
	•	penaltyBps
	•	sponsorCanTrade
	•	A URI to off-chain policy text.

This shows you’re aligning with the “reputational constraint” approach described in the paper.

Prompt for LLM:
	•	“Implement a simple anti-exploitation policy: prevent sponsor from calling trade functions if sponsorCanTrade is false, and add tests verifying this.”

---

9. How to Use the LLM Effectively (Prompting Pattern)

To keep the code clean, use a consistent prompt structure:
	1.	Spec first, then code.
	•	Paste a small, self-contained spec (1–2 screens max).
	•	Ask for a single contract or single function at a time.
	2.	Example prompt for OpportunityMarket v1:

You are acting as a senior Solidity engineer. Implement a single Solidity file OpportunityMarket.sol with:
	•	Solidity version ^0.8.20.
	•	Imports: IERC20, ReentrancyGuard, Ownable from OpenZeppelin.
	•	Constructor parameters: sponsor, collateral token, initial reserves, penaltyBps, opportunityWindowEnd.
	•	Functions: buyYes, lock, resolveYes, resolveNo, claimYes, claimNo, claimSponsorPayout.
	•	AMM math: constant product x*y=k; sponsor is the only LP; traders only buy YES, no selling in v1.
	•	Slippage controls: buyYes takes (collateralIn, minYesOut, maxPrice) and reverts if execution price > maxPrice.
	•	Use custom errors and events; do not emit per-trade price in events.
	•	Document invariants in NatSpec comments.

	3.	Then ask for tests:

Now write Foundry tests for OpportunityMarket.sol in test/OpportunityMarket.t.sol. Use forge-std/Test.sol. Cover at least:
	•	happy-path buyYes;
	•	slippage revert;
	•	resolveYes payouts;
	•	resolveNo penalty and refund.

	4.	Iterate:
	•	Run forge test.
	•	Paste failures back to LLM.
	•	Ask for concrete fixes.

---

If you want, next step I can do is: design the exact storage layout and function signatures for OpportunityMarket in code form so you can drop it straight into Foundry and iterate.


