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
        uint256 initialCollateral;
        uint256 initialVirtualYes;
        uint16 penaltyBps;
        uint256 opportunityWindowEnd;
        bool sponsorCanTrade;
        bytes32 questionHash;
    }

    struct MarketConfig {
        address market;
        address sponsor;
        address collateralToken;
        uint16 penaltyBps;
        uint256 opportunityWindowEnd;
        bool sponsorCanTrade;
        bytes32 questionHash;
    }

    MarketConfig[] public markets;
    mapping(address => bool) public isMarket;

    event MarketCreated(
        uint256 indexed marketId, address indexed market, address indexed sponsor, bytes32 questionHash
    );

    error InvalidParams();
    error UnauthorizedCreator();

    constructor(address initialOwner) Ownable(initialOwner == address(0) ? msg.sender : initialOwner) {}

    function createMarket(CreateParams calldata params) external returns (address marketAddr) {
        address sponsor_ = params.sponsor == address(0) ? msg.sender : params.sponsor;
        if (msg.sender != sponsor_ && msg.sender != owner()) revert UnauthorizedCreator();
        if (
            sponsor_ == address(0) || params.collateralToken == address(0) || params.initialCollateral == 0
                || params.initialVirtualYes == 0 || params.penaltyBps > MAX_BPS
        ) {
            revert InvalidParams();
        }

        OpportunityMarket market = new OpportunityMarket(
            sponsor_,
            IERC20(params.collateralToken),
            params.initialCollateral,
            params.initialVirtualYes,
            params.penaltyBps,
            params.opportunityWindowEnd,
            params.sponsorCanTrade,
            params.questionHash
        );

        IERC20(params.collateralToken).safeTransferFrom(sponsor_, address(market), params.initialCollateral);

        markets.push(
            MarketConfig({
                market: address(market),
                sponsor: sponsor_,
                collateralToken: params.collateralToken,
                penaltyBps: params.penaltyBps,
                opportunityWindowEnd: params.opportunityWindowEnd,
                sponsorCanTrade: params.sponsorCanTrade,
                questionHash: params.questionHash
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
