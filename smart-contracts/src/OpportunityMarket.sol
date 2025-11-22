// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IOpportunityMarket} from "./interfaces/IOpportunityMarket.sol";

/**
 * @title OpportunityMarket
 * @notice Constant-product YES market with sponsor-provided liquidity.
 *         Trades execute against virtual YES reserves; price data stays off-chain by
 *         avoiding detailed events. Confidentiality of storage is delegated to Sapphire.
 */
contract OpportunityMarket is IOpportunityMarket, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant MAX_BPS = 10_000;
    uint256 private constant PRICE_SCALE = 1e18;

    IERC20 public immutable override collateral;
    address public immutable override sponsor;
    uint16 public immutable override penaltyBps;
    uint256 public immutable override opportunityWindowEnd;
    bytes32 public immutable override questionHash;

    State public override state;
    uint256 public override totalYesShares;
    uint256 public override refundLiability;
    uint256 public override penaltyAvailable;
    bool public residualClaimed;

    uint256 public reserveCollateral;
    uint256 public reserveYes;
    uint256 public k;
    uint256 public totalStake;

    mapping(address => uint256) public override yesBalance;
    mapping(address => uint256) public override stakeAmount;

    event Locked(uint256 timestamp);
    event Resolve(State outcome);
    event YesClaimed(address indexed trader, uint256 payout);
    event NoClaimed(address indexed trader, uint256 refund, uint256 penaltyPaid);
    event SponsorPayout(uint256 amount);

    error InvalidState(State current);
    error PenaltyTooLarge();
    error ZeroAddress();
    error ZeroAmount();
    error PriceTooHigh();
    error SlippageTooHigh();
    error SponsorTradingBlocked();
    error WindowStillOpen();
    error TradingClosed();
    error InitialCollateralTooLow();
    error NothingToClaim();
    error OutstandingClaims();

    constructor(
        address _sponsor,
        IERC20 _collateral,
        uint256 _initialCollateral,
        uint256 _initialYes,
        uint16 _penaltyBps,
        uint256 _opportunityWindowEnd,
        bytes32 _questionHash
    ) Ownable(_sponsor) {
        if (_sponsor == address(0) || address(_collateral) == address(0)) {
            revert ZeroAddress();
        }
        if (_initialCollateral == 0 || _initialYes == 0) {
            revert ZeroAmount();
        }
        if (_penaltyBps > MAX_BPS) {
            revert PenaltyTooLarge();
        }
        if (_initialCollateral < _initialYes) {
            revert InitialCollateralTooLow();
        }

        sponsor = _sponsor;
        collateral = _collateral;
        penaltyBps = _penaltyBps;
        opportunityWindowEnd = _opportunityWindowEnd;
        questionHash = _questionHash;

        reserveCollateral = _initialCollateral;
        reserveYes = _initialYes;
        k = _initialCollateral * _initialYes;
        state = State.Trading;
    }

    /**
     * @notice Executes a YES purchase against the constant product curve.
     * @dev maxPrice is expressed in collateral per YES, scaled by 1e18.
     */
    function buyYes(uint256 collateralIn, uint256 minYesOut, uint256 maxPrice)
        external
        override
        nonReentrant
        returns (uint256 yesOut)
    {
        if (opportunityWindowEnd != 0 && block.timestamp >= opportunityWindowEnd) {
            _autoLockIfWindowPassed();
            revert TradingClosed();
        }
        _autoLockIfWindowPassed();
        if (state != State.Trading) revert InvalidState(state);
        if (msg.sender == sponsor) revert SponsorTradingBlocked();
        if (collateralIn == 0 || minYesOut == 0 || maxPrice == 0) revert ZeroAmount();

        yesOut = (reserveYes * collateralIn) / (reserveCollateral + collateralIn);
        if (yesOut == 0 || yesOut < minYesOut) revert SlippageTooHigh();

        uint256 executionPrice = (collateralIn * PRICE_SCALE) / yesOut;
        if (executionPrice > maxPrice) revert PriceTooHigh();

        collateral.safeTransferFrom(msg.sender, address(this), collateralIn);

        reserveCollateral += collateralIn;
        reserveYes -= yesOut;
        k = reserveCollateral * reserveYes;

        yesBalance[msg.sender] += yesOut;
        stakeAmount[msg.sender] += collateralIn;
        totalYesShares += yesOut;
        totalStake += collateralIn;
    }

    function lock() external override onlyOwner {
        if (state != State.Trading) revert InvalidState(state);
        if (opportunityWindowEnd != 0 && block.timestamp < opportunityWindowEnd) {
            revert WindowStillOpen();
        }
        state = State.Locked;
        emit Locked(block.timestamp);
    }

    function resolveYes() external override onlyOwner {
        _autoLockIfWindowPassed();
        if (state != State.Locked) revert InvalidState(state);
        state = State.ResolvedYes;
        emit Resolve(State.ResolvedYes);
    }

    function resolveNo() external override onlyOwner {
        _autoLockIfWindowPassed();
        if (state != State.Locked) revert InvalidState(state);
        state = State.ResolvedNo;

        penaltyAvailable = (totalStake * penaltyBps) / MAX_BPS;
        refundLiability = totalStake - penaltyAvailable;

        emit Resolve(State.ResolvedNo);
    }

    function claimYes() external override nonReentrant returns (uint256 collateralOut) {
        if (state != State.ResolvedYes) revert InvalidState(state);

        uint256 balance = yesBalance[msg.sender];
        if (balance == 0) revert NothingToClaim();

        uint256 stake = stakeAmount[msg.sender];

        yesBalance[msg.sender] = 0;
        stakeAmount[msg.sender] = 0;

        totalYesShares -= balance;
        totalStake -= stake;

        collateralOut = balance;
        collateral.safeTransfer(msg.sender, collateralOut);

        emit YesClaimed(msg.sender, collateralOut);
    }

    function claimNo() external override nonReentrant returns (uint256 refundOut) {
        if (state != State.ResolvedNo) revert InvalidState(state);

        uint256 stake = stakeAmount[msg.sender];
        if (stake == 0) revert NothingToClaim();

        uint256 penalty = (stake * penaltyBps) / MAX_BPS;
        refundOut = stake - penalty;

        yesBalance[msg.sender] = 0;
        stakeAmount[msg.sender] = 0;

        totalStake -= stake;
        refundLiability -= refundOut;

        collateral.safeTransfer(msg.sender, refundOut);

        emit NoClaimed(msg.sender, refundOut, penalty);
    }

    function claimSponsorPayout() external override onlyOwner nonReentrant returns (uint256 amountOut) {
        if (state == State.ResolvedYes) {
            if (totalYesShares != 0) revert OutstandingClaims();
            if (residualClaimed) revert NothingToClaim();

            amountOut = collateral.balanceOf(address(this));
            if (amountOut == 0) revert NothingToClaim();

            residualClaimed = true;
            collateral.safeTransfer(sponsor, amountOut);
        } else if (state == State.ResolvedNo) {
            if (penaltyAvailable > 0) {
                amountOut = penaltyAvailable;
                penaltyAvailable = 0;
                collateral.safeTransfer(sponsor, amountOut);
            } else {
                if (refundLiability != 0) revert OutstandingClaims();
                if (residualClaimed) revert NothingToClaim();

                amountOut = collateral.balanceOf(address(this));
                if (amountOut == 0) revert NothingToClaim();

                residualClaimed = true;
                collateral.safeTransfer(sponsor, amountOut);
            }
        } else {
            revert InvalidState(state);
        }

        emit SponsorPayout(amountOut);
    }

    function getReserves() external view override returns (uint256 collateralReserve, uint256 virtualYesReserve) {
        collateralReserve = reserveCollateral;
        virtualYesReserve = reserveYes;
    }

    function _autoLockIfWindowPassed() internal {
        if (
            state == State.Trading && opportunityWindowEnd != 0 && block.timestamp >= opportunityWindowEnd
        ) {
            state = State.Locked;
            emit Locked(block.timestamp);
        }
    }
}
