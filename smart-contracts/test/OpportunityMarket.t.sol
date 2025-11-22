// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {OpportunityMarket} from "../src/OpportunityMarket.sol";
import {IOpportunityMarket} from "../src/interfaces/IOpportunityMarket.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OpportunityMarketTest is Test {
    uint256 private constant PRICE_SCALE = 1e18;

    MockERC20 internal collateral;
    OpportunityMarket internal market;

    address internal sponsor = address(0xA11CE);
    address internal trader = address(0xBEEF);
    uint256 internal initialCollateral = 1_000 ether;
    uint256 internal initialYes = 1_000 ether;
    uint16 internal penaltyBps = 2_000;
    bytes32 internal questionHash = keccak256("Will we sign Artist X in 2025?");
    uint256 internal totalInitialCollateral;
    uint256 internal constant OPTION_ALPHA = 0;
    uint256 internal constant OPTION_BETA = 1;

    function setUp() public {
        collateral = new MockERC20("Mock Collateral", "MCO");

        totalInitialCollateral = initialCollateral * 2;

        collateral.mint(sponsor, totalInitialCollateral * 2);
        collateral.mint(trader, 1_000 ether);

        OpportunityMarket.OptionConfig[] memory configs = new OpportunityMarket.OptionConfig[](2);
        configs[0] = OpportunityMarket.OptionConfig({
            optionHash: keccak256("OptionAlpha"),
            initialCollateral: initialCollateral,
            initialVirtualYes: initialYes
        });
        configs[1] = OpportunityMarket.OptionConfig({
            optionHash: keccak256("OptionBeta"),
            initialCollateral: initialCollateral,
            initialVirtualYes: initialYes
        });

        vm.prank(sponsor);
        market = new OpportunityMarket(
            sponsor,
            IERC20(address(collateral)),
            penaltyBps,
            block.timestamp + 7 days,
            questionHash,
            configs
        );

        vm.prank(sponsor);
        collateral.transfer(address(market), totalInitialCollateral);

        vm.prank(trader);
        collateral.approve(address(market), type(uint256).max);
    }

    function testBuyYesUpdatesReservesAndBalances() public {
        uint256 collateralIn = 100 ether;
        uint256 yesOut = _executeBuy(OPTION_ALPHA, trader, collateralIn, type(uint256).max);

        assertGt(yesOut, 0);
        assertEq(market.yesBalance(trader, OPTION_ALPHA), yesOut);
        assertEq(market.stakeAmount(trader, OPTION_ALPHA), collateralIn);
        assertEq(market.stakeAmount(trader), collateralIn);
        (uint256 reserveCollateral, uint256 reserveYes) = market.getReserves(OPTION_ALPHA);
        assertEq(reserveCollateral, initialCollateral + collateralIn);
        assertLt(reserveYes, initialYes);
        assertEq(uint256(market.state()), uint256(IOpportunityMarket.State.Trading));
    }

    function testBuyYesRespectsMaxPrice() public {
        uint256 collateralIn = 50 ether;
        (uint256 yesOutEstimate,) = _quote(OPTION_ALPHA, collateralIn);
        uint256 actualPrice = (collateralIn * PRICE_SCALE) / yesOutEstimate;

        vm.expectRevert(OpportunityMarket.PriceTooHigh.selector);
        vm.prank(trader);
        market.buyYes(OPTION_ALPHA, collateralIn, yesOutEstimate, actualPrice - 1);
    }

    function testLockStopsTrading() public {
        _executeBuy(OPTION_ALPHA, trader, 10 ether, type(uint256).max);

        vm.warp(block.timestamp + 8 days);
        vm.prank(sponsor);
        market.lock();

        vm.expectRevert(OpportunityMarket.TradingClosed.selector);
        vm.prank(trader);
        market.buyYes(OPTION_ALPHA, 1 ether, 1, type(uint256).max);
    }

    function testResolveYesPayouts() public {
        uint256 collateralIn = 80 ether;
        uint256 yesOut = _executeBuy(OPTION_ALPHA, trader, collateralIn, type(uint256).max);

        vm.warp(block.timestamp + 8 days);
        vm.prank(sponsor);
        market.lock();
        vm.prank(sponsor);
        market.resolveYes(OPTION_ALPHA);

        uint256 balBefore = collateral.balanceOf(trader);
        vm.prank(trader);
        uint256 payout = market.claimYes(OPTION_ALPHA);
        uint256 balAfter = collateral.balanceOf(trader);

        assertEq(payout, yesOut);
        assertEq(balAfter - balBefore, yesOut);
        assertEq(market.yesBalance(trader, OPTION_ALPHA), 0);
    }

    function testResolveNoPenaltyAndRefund() public {
        uint256 collateralIn = 60 ether;
        _executeBuy(OPTION_ALPHA, trader, collateralIn, type(uint256).max);

        vm.warp(block.timestamp + 8 days);
        vm.prank(sponsor);
        market.lock();
        vm.prank(sponsor);
        market.resolveNo();

        uint256 traderBefore = collateral.balanceOf(trader);
        vm.prank(trader);
        uint256 refund = market.claimNo();
        uint256 traderAfter = collateral.balanceOf(trader);

        uint256 expectedPenalty = (collateralIn * penaltyBps) / 10_000;
        uint256 expectedRefund = collateralIn - expectedPenalty;
        assertEq(refund, expectedRefund);
        assertEq(traderAfter - traderBefore, expectedRefund);

        uint256 sponsorBefore = collateral.balanceOf(sponsor);
        vm.prank(sponsor);
        uint256 penaltyPayout = market.claimSponsorPayout();
        uint256 sponsorAfter = collateral.balanceOf(sponsor);
        assertEq(penaltyPayout, expectedPenalty);
        assertEq(sponsorAfter - sponsorBefore, expectedPenalty);
    }

    function testOnlyWinningOptionCanClaim() public {
        _executeBuy(OPTION_ALPHA, trader, 40 ether, type(uint256).max);
        _executeBuy(OPTION_BETA, trader, 30 ether, type(uint256).max);

        vm.warp(block.timestamp + 8 days);
        vm.prank(sponsor);
        market.lock();
        vm.prank(sponsor);
        market.resolveYes(OPTION_ALPHA);

        vm.prank(trader);
        market.claimYes(OPTION_ALPHA);

        vm.expectRevert(abi.encodeWithSelector(OpportunityMarket.InvalidOption.selector, OPTION_BETA));
        vm.prank(trader);
        market.claimYes(OPTION_BETA);
    }

    function testSponsorCannotTradeWhenFlagged() public {
        vm.expectRevert(OpportunityMarket.SponsorTradingBlocked.selector);
        vm.prank(sponsor);
        market.buyYes(OPTION_ALPHA, 1 ether, 1, type(uint256).max);
    }

    function testPenaltyUpperBoundEnforced() public {
        OpportunityMarket.OptionConfig[] memory configs = new OpportunityMarket.OptionConfig[](1);
        configs[0] = OpportunityMarket.OptionConfig({
            optionHash: keccak256("config"),
            initialCollateral: initialCollateral,
            initialVirtualYes: initialYes
        });
        vm.expectRevert(OpportunityMarket.PenaltyTooLarge.selector);
        new OpportunityMarket(
            sponsor,
            IERC20(address(collateral)),
            uint16(10_001),
            block.timestamp + 7 days,
            questionHash,
            configs
        );
    }

    function testInitialCollateralMustCoverVirtualYes() public {
        OpportunityMarket.OptionConfig[] memory configs = new OpportunityMarket.OptionConfig[](1);
        configs[0] = OpportunityMarket.OptionConfig({
            optionHash: keccak256("config"),
            initialCollateral: initialCollateral / 2,
            initialVirtualYes: initialYes
        });
        vm.expectRevert(OpportunityMarket.InitialCollateralTooLow.selector);
        new OpportunityMarket(
            sponsor,
            IERC20(address(collateral)),
            penaltyBps,
            block.timestamp + 7 days,
            questionHash,
            configs
        );
    }

    function testTradingStopsAfterWindowEndAutomatically() public {
        vm.warp(block.timestamp + 8 days);
        vm.expectRevert(OpportunityMarket.TradingClosed.selector);
        vm.prank(trader);
        market.buyYes(OPTION_ALPHA, 1 ether, 1, type(uint256).max);
    }

    function testResolveYesAutoLocksAfterWindow() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(sponsor);
        market.resolveYes(OPTION_ALPHA);
        assertEq(uint256(market.state()), uint256(IOpportunityMarket.State.ResolvedYes));
    }

    function testResolveNoAutoLocksAfterWindow() public {
        uint256 collateralIn = 20 ether;
        _executeBuy(OPTION_ALPHA, trader, collateralIn, type(uint256).max);

        vm.warp(block.timestamp + 8 days);
        vm.prank(sponsor);
        market.resolveNo();

        uint256 penalty = (collateralIn * penaltyBps) / 10_000;
        assertEq(market.penaltyAvailable(), penalty);
        assertEq(uint256(market.state()), uint256(IOpportunityMarket.State.ResolvedNo));
    }

    function testFuzzReserveMatchesBalance(address user, uint256 amount) public {
        vm.assume(user != address(0));
        vm.assume(user != sponsor);

        uint256 collateralIn = bound(amount, 1 ether, 200 ether);
        collateral.mint(user, collateralIn);
        vm.prank(user);
        collateral.approve(address(market), collateralIn);

        uint256 yesOutMin;
        {
            (uint256 yesOut,) = _quote(OPTION_ALPHA, collateralIn);
            yesOutMin = yesOut;
        }

        vm.prank(user);
        market.buyYes(OPTION_ALPHA, collateralIn, yesOutMin, type(uint256).max);

        uint256 aggregateReserves;
        uint256 optionsLength = market.optionCount();
        for (uint256 i = 0; i < optionsLength; ++i) {
            (uint256 reserveCollateral,) = market.getReserves(i);
            aggregateReserves += reserveCollateral;
        }
        assertEq(collateral.balanceOf(address(market)), aggregateReserves);
    }

    function _executeBuy(uint256 optionId, address user, uint256 collateralIn, uint256 maxPrice)
        internal
        returns (uint256)
    {
        (uint256 yesOutMin,) = _quote(optionId, collateralIn);
        vm.prank(user);
        return market.buyYes(optionId, collateralIn, yesOutMin, maxPrice);
    }

    function _quote(uint256 optionId, uint256 collateralIn) internal view returns (uint256 yesOut, uint256 newReserveYes) {
        (uint256 reserveCollateral, uint256 reserveYes) = market.getReserves(optionId);
        yesOut = (reserveYes * collateralIn) / (reserveCollateral + collateralIn);
        newReserveYes = reserveYes - yesOut;
    }
}
