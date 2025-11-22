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

    struct OptionView {
        bytes32 optionHash;
        uint256 collateralReserve;
        uint256 virtualYesReserve;
        uint256 totalYesShares;
        uint256 totalStake;
    }

    function buyYes(uint256 optionId, uint256 collateralIn, uint256 minYesOut, uint256 maxPrice)
        external
        returns (uint256 yesOut);

    function lock() external;

    function resolveYes(uint256 optionId) external;

    function resolveNo() external;

    function claimYes(uint256 optionId) external returns (uint256 collateralOut);

    function claimNo() external returns (uint256 refundOut);

    function claimSponsorPayout() external returns (uint256 amountOut);

    function collateral() external view returns (IERC20);

    function sponsor() external view returns (address);

    function penaltyBps() external view returns (uint16);

    function opportunityWindowEnd() external view returns (uint256);

    function questionHash() external view returns (bytes32);

    function state() external view returns (State);

    function optionCount() external view returns (uint256);

    function winningOptionId() external view returns (uint256);

    function hasWinningOption() external view returns (bool);

    function totalYesShares() external view returns (uint256);

    function refundLiability() external view returns (uint256);

    function penaltyAvailable() external view returns (uint256);

    function yesBalance(address user, uint256 optionId) external view returns (uint256);

    function stakeAmount(address user) external view returns (uint256);

    function stakeAmount(address user, uint256 optionId) external view returns (uint256);

    function getReserves(uint256 optionId)
        external
        view
        returns (uint256 collateralReserve, uint256 virtualYesReserve);

    function getOption(uint256 optionId) external view returns (OptionView memory);
}
