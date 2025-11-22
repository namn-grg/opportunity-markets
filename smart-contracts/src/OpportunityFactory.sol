// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {OpportunityMarket} from "./OpportunityMarket.sol";

/**
 * @title OpportunityFactory
 * @notice Deploys OpportunityMarket instances and keeps lightweight metadata on-chain.
 */
contract OpportunityFactory is Ownable {
    using SafeERC20 for IERC20;

    uint256 private constant MAX_BPS = 10_000;

    struct CreateParams {
        address sponsor;
        address collateralToken;
        uint16 penaltyBps;
        uint256 opportunityWindowEnd;
        bytes32 questionHash;
        OpportunityMarket.OptionConfig[] options;
    }

    struct MarketConfig {
        address market;
        address sponsor;
        address collateralToken;
        uint16 penaltyBps;
        uint256 opportunityWindowEnd;
        bytes32 questionHash;
        uint256 optionCount;
    }

    MarketConfig[] public markets;
    mapping(address => bool) public isMarket;

    event MarketCreated(
        uint256 indexed marketId, address indexed market, address indexed sponsor, bytes32 questionHash
    );

    error InvalidParams();
    error UnauthorizedCreator();
    error UnderCollateralized();

    constructor(address initialOwner) Ownable(initialOwner == address(0) ? msg.sender : initialOwner) {}

    function createMarket(CreateParams calldata params) external returns (address marketAddr) {
        address sponsor_ = params.sponsor == address(0) ? msg.sender : params.sponsor;
        if (msg.sender != sponsor_ && msg.sender != owner()) revert UnauthorizedCreator();
        if (sponsor_ == address(0) || params.collateralToken == address(0) || params.penaltyBps > MAX_BPS) {
            revert InvalidParams();
        }
        if (params.options.length == 0) revert InvalidParams();

        uint256 totalInitialCollateral;
        for (uint256 i = 0; i < params.options.length; ++i) {
            OpportunityMarket.OptionConfig calldata cfg = params.options[i];
            if (cfg.initialCollateral == 0 || cfg.initialVirtualYes == 0) revert InvalidParams();
            if (cfg.initialCollateral < cfg.initialVirtualYes) revert UnderCollateralized();
            totalInitialCollateral += cfg.initialCollateral;
        }

        OpportunityMarket market = new OpportunityMarket(
            sponsor_,
            IERC20(params.collateralToken),
            params.penaltyBps,
            params.opportunityWindowEnd,
            params.questionHash,
            params.options
        );

        IERC20(params.collateralToken).safeTransferFrom(sponsor_, address(market), totalInitialCollateral);

        markets.push(
            MarketConfig({
                market: address(market),
                sponsor: sponsor_,
                collateralToken: params.collateralToken,
                penaltyBps: params.penaltyBps,
                opportunityWindowEnd: params.opportunityWindowEnd,
                questionHash: params.questionHash,
                optionCount: params.options.length
            })
        );

        isMarket[address(market)] = true;
        emit MarketCreated(markets.length - 1, address(market), sponsor_, params.questionHash);
        return address(market);
    }

    function marketsLength() external view returns (uint256) {
        return markets.length;
    }

    function getMarket(uint256 index) external view returns (MarketConfig memory) {
        return markets[index];
    }
}
