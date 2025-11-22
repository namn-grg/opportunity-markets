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

    function setUp() public {
        collateral = new MockERC20("Mock Collateral", "MCO");

        collateral.mint(sponsor, initialCollateral * 2);
        collateral.mint(trader, 1_000 ether);

        vm.prank(sponsor);
        market = new OpportunityMarket(
            sponsor,
            IERC20(address(collateral)),
            initialCollateral,
            initialYes,
            penaltyBps,
            block.timestamp + 7 days,
            true,
            questionHash
        );

        vm.prank(sponsor);
        collateral.transfer(address(market), initialCollateral);

        vm.prank(trader);
        collateral.approve(address(market), type(uint256).max);
    }

    function testBuyYesUpdatesReservesAndBalances() public {
        uint256 collateralIn = 100 ether;
        uint256 yesOut = _executeBuy(trader, collateralIn, type(uint256).max);

        assertGt(yesOut, 0);
        assertEq(market.yesBalance(trader), yesOut);
        assertEq(market.stakeAmount(trader), collateralIn);
        assertEq(market.reserveCollateral(), initialCollateral + collateralIn);
        assertLt(market.reserveYes(), initialYes);
        assertEq(uint256(market.state()), uint256(IOpportunityMarket.State.Trading));
    }

    function testBuyYesRespectsMaxPrice() public {
        uint256 collateralIn = 50 ether;
        (uint256 yesOutEstimate,) = _quote(collateralIn);
        uint256 actualPrice = (collateralIn * PRICE_SCALE) / yesOutEstimate;

        vm.expectRevert(OpportunityMarket.PriceTooHigh.selector);
        vm.prank(trader);
        market.buyYes(collateralIn, yesOutEstimate, actualPrice - 1);
    }

    function testLockStopsTrading() public {
        _executeBuy(trader, 10 ether, type(uint256).max);

        vm.warp(block.timestamp + 8 days);
        vm.prank(sponsor);
        market.lock();

        vm.expectRevert(
            abi.encodeWithSelector(OpportunityMarket.InvalidState.selector, IOpportunityMarket.State.Locked)
        );
        vm.prank(trader);
        market.buyYes(1 ether, 1, type(uint256).max);
    }

    function testResolveYesPayouts() public {
        uint256 collateralIn = 80 ether;
        uint256 yesOut = _executeBuy(trader, collateralIn, type(uint256).max);

        vm.warp(block.timestamp + 8 days);
        vm.prank(sponsor);
        market.lock();
        vm.prank(sponsor);
        market.resolveYes();

        uint256 balBefore = collateral.balanceOf(trader);
        vm.prank(trader);
        uint256 payout = market.claimYes();
        uint256 balAfter = collateral.balanceOf(trader);

        assertEq(payout, yesOut);
        assertEq(balAfter - balBefore, yesOut);
        assertEq(market.yesBalance(trader), 0);
    }

    function testResolveNoPenaltyAndRefund() public {
        uint256 collateralIn = 60 ether;
        _executeBuy(trader, collateralIn, type(uint256).max);

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

    function testSponsorCannotTradeWhenFlagged() public {
        OpportunityMarket restricted = new OpportunityMarket(
            sponsor,
            IERC20(address(collateral)),
            initialCollateral,
            initialYes,
            penaltyBps,
            block.timestamp + 7 days,
            false,
            questionHash
        );

        vm.prank(sponsor);
        collateral.transfer(address(restricted), initialCollateral);

        vm.prank(sponsor);
        collateral.approve(address(restricted), type(uint256).max);

        vm.expectRevert(OpportunityMarket.SponsorTradingBlocked.selector);
        vm.prank(sponsor);
        restricted.buyYes(1 ether, 1, type(uint256).max);
    }

    function testPenaltyUpperBoundEnforced() public {
        vm.expectRevert(OpportunityMarket.PenaltyTooLarge.selector);
        new OpportunityMarket(
            sponsor,
            IERC20(address(collateral)),
            initialCollateral,
            initialYes,
            uint16(10_001),
            block.timestamp + 7 days,
            true,
            questionHash
        );
    }

    function _executeBuy(address user, uint256 collateralIn, uint256 maxPrice) internal returns (uint256) {
        (uint256 yesOutMin,) = _quote(collateralIn);
        vm.prank(user);
        return market.buyYes(collateralIn, yesOutMin, maxPrice);
    }

    function _quote(uint256 collateralIn) internal view returns (uint256 yesOut, uint256 newReserveYes) {
        uint256 newReserveCollateral = market.reserveCollateral() + collateralIn;
        uint256 kValue = market.k();
        newReserveYes = kValue / newReserveCollateral;
        yesOut = market.reserveYes() - newReserveYes;
    }
}
