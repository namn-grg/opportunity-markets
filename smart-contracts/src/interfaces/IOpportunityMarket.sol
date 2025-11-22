// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOpportunityMarket {
    enum State {
        Trading,
        Locked,
        ResolvedYes,
        ResolvedNo
    }

    struct MarketMetadata {
        address sponsor;
        address collateralToken;
        uint16 penaltyBps;
        uint256 opportunityWindowEnd;
        bytes32 questionHash;
    }

    function buyYes(uint256 collateralIn, uint256 minYesOut, uint256 maxPrice) external returns (uint256 yesOut);

    function lock() external;

    function resolveYes() external;

    function resolveNo() external;

    function claimYes() external returns (uint256 collateralOut);

    function claimNo() external returns (uint256 refundOut);

    function claimSponsorPayout() external returns (uint256 amountOut);

    function collateral() external view returns (IERC20);

    function sponsor() external view returns (address);

    function penaltyBps() external view returns (uint16);

    function opportunityWindowEnd() external view returns (uint256);

    function questionHash() external view returns (bytes32);

    function state() external view returns (State);

    function totalYesShares() external view returns (uint256);

    function refundLiability() external view returns (uint256);

    function penaltyAvailable() external view returns (uint256);

    function yesBalance(address user) external view returns (uint256);

    function stakeAmount(address user) external view returns (uint256);

    function getReserves() external view returns (uint256 collateralReserve, uint256 virtualYesReserve);
}
