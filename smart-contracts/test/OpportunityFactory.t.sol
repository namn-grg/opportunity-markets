// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {OpportunityFactory} from "../src/OpportunityFactory.sol";
import {OpportunityMarket} from "../src/OpportunityMarket.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OpportunityFactoryTest is Test {
    MockERC20 internal collateral;
    OpportunityFactory internal factory;

    address internal factoryOwner = address(0xFACADE);
    address internal sponsor = address(0xBADDAD);
    uint256 internal initialCollateral = 1_000 ether;

    function setUp() public {
        collateral = new MockERC20("Mock Collateral", "MCO");
        factory = new OpportunityFactory(factoryOwner);

        collateral.mint(sponsor, initialCollateral);
    }

    function testCreateMarketHappyPath() public {
        OpportunityMarket.OptionConfig[] memory configs = _defaultOptions();
        OpportunityFactory.CreateParams memory params;
        params.sponsor = sponsor;
        params.collateralToken = address(collateral);
        params.penaltyBps = 1_000;
        params.opportunityWindowEnd = block.timestamp + 30 days;
        params.questionHash = keccak256("test question");
        params.options = configs;

        vm.prank(sponsor);
        collateral.approve(address(factory), initialCollateral);

        vm.prank(sponsor);
        address marketAddr = factory.createMarket(params);

        assertTrue(factory.isMarket(marketAddr));
        assertEq(factory.marketsLength(), 1);

        OpportunityFactory.MarketConfig memory cfg = factory.getMarket(0);
        assertEq(cfg.market, marketAddr);
        assertEq(cfg.sponsor, sponsor);
        assertEq(cfg.collateralToken, address(collateral));
        assertEq(cfg.penaltyBps, params.penaltyBps);
        assertEq(cfg.optionCount, configs.length);

        OpportunityMarket market = OpportunityMarket(marketAddr);
        assertEq(address(market.collateral()), address(collateral));
        assertEq(market.penaltyBps(), params.penaltyBps);
        assertEq(market.sponsor(), sponsor);
        assertEq(collateral.balanceOf(marketAddr), initialCollateral);
    }

    function testUnauthorizedCreatorReverts() public {
        OpportunityFactory.CreateParams memory params;
        params.sponsor = sponsor;
        params.collateralToken = address(collateral);
        params.penaltyBps = 1_000;
        params.opportunityWindowEnd = block.timestamp + 30 days;
        params.questionHash = keccak256("test question");
        params.options = _defaultOptions();

        vm.prank(address(0xCAFE));
        vm.expectRevert(OpportunityFactory.UnauthorizedCreator.selector);
        factory.createMarket(params);
    }

    function testCreateMarketRevertsWhenUndercollateralized() public {
        OpportunityFactory.CreateParams memory params;
        params.sponsor = sponsor;
        params.collateralToken = address(collateral);
        params.penaltyBps = 1_000;
        params.opportunityWindowEnd = block.timestamp + 30 days;
        params.questionHash = keccak256("test question");
        params.options = _undercollateralizedOptions();

        vm.prank(sponsor);
        collateral.approve(address(factory), initialCollateral);

        vm.prank(sponsor);
        vm.expectRevert(OpportunityFactory.UnderCollateralized.selector);
        factory.createMarket(params);
    }

    function _defaultOptions() internal view returns (OpportunityMarket.OptionConfig[] memory configs) {
        configs = new OpportunityMarket.OptionConfig[](2);
        uint256 perOption = initialCollateral / 2;
        bytes32 base = keccak256("option");
        for (uint256 i = 0; i < configs.length; ++i) {
            configs[i] = OpportunityMarket.OptionConfig({
                optionHash: keccak256(abi.encode(base, i)),
                initialCollateral: perOption,
                initialVirtualYes: perOption
            });
        }
    }

    function _undercollateralizedOptions() internal view returns (OpportunityMarket.OptionConfig[] memory configs) {
        configs = new OpportunityMarket.OptionConfig[](1);
        configs[0] = OpportunityMarket.OptionConfig({
            optionHash: keccak256("undercollateralized"),
            initialCollateral: initialCollateral / 4,
            initialVirtualYes: initialCollateral / 2
        });
    }
}
