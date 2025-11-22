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

    struct Option {
        bytes32 optionHash;
        uint256 reserveCollateral;
        uint256 reserveYes;
        uint256 k;
        uint256 totalYesShares;
        uint256 totalStake;
    }

    struct OptionConfig {
        bytes32 optionHash;
        uint256 initialCollateral;
        uint256 initialVirtualYes;
    }

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
    uint256 public totalStake;
    uint256 public override winningOptionId;
    bool public override hasWinningOption;

    Option[] private _options;

    mapping(uint256 => mapping(address => uint256)) private _yesBalance;
    mapping(uint256 => mapping(address => uint256)) private _stakeByOption;
    mapping(address => uint256) private _stakeAmount;

    event Locked(uint256 timestamp);
    event Resolve(State outcome);
    event YesClaimed(address indexed trader, uint256 indexed optionId, uint256 payout);
    event NoClaimed(address indexed trader, uint256 refund, uint256 penaltyPaid);
    event SponsorPayout(uint256 amount);

    error InvalidState(State current);
    error InvalidOption(uint256 optionId);
    error PenaltyTooLarge();
    error ZeroAddress();
    error ZeroAmount();
    error InvalidOptions();
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
        uint16 _penaltyBps,
        uint256 _opportunityWindowEnd,
        bytes32 _questionHash,
        OptionConfig[] memory optionConfigs
    ) Ownable(_sponsor) {
        if (_sponsor == address(0) || address(_collateral) == address(0)) {
            revert ZeroAddress();
        }
        if (_penaltyBps > MAX_BPS) {
            revert PenaltyTooLarge();
        }
        if (optionConfigs.length == 0) {
            revert InvalidOptions();
        }
        sponsor = _sponsor;
        collateral = _collateral;
        penaltyBps = _penaltyBps;
        opportunityWindowEnd = _opportunityWindowEnd;
        questionHash = _questionHash;

        uint256 totalInitialCollateral;
        for (uint256 i = 0; i < optionConfigs.length; ++i) {
            OptionConfig memory cfg = optionConfigs[i];
            if (cfg.initialCollateral == 0 || cfg.initialVirtualYes == 0) revert ZeroAmount();
            if (cfg.initialCollateral < cfg.initialVirtualYes) revert InitialCollateralTooLow();

            Option storage opt = _options.push();
            opt.optionHash = cfg.optionHash;
            opt.reserveCollateral = cfg.initialCollateral;
            opt.reserveYes = cfg.initialVirtualYes;
            opt.k = cfg.initialCollateral * cfg.initialVirtualYes;

            totalInitialCollateral += cfg.initialCollateral;
        }

        if (totalInitialCollateral == 0) revert ZeroAmount();
        state = State.Trading;
    }

    /**
     * @notice Executes a YES purchase against the constant product curve.
     * @dev maxPrice is expressed in collateral per YES, scaled by 1e18.
     */
    function buyYes(uint256 optionId, uint256 collateralIn, uint256 minYesOut, uint256 maxPrice)
        external
        override
        nonReentrant
        returns (uint256 yesOut)
    {
        Option storage option = _optionOrRevert(optionId);
        if (opportunityWindowEnd != 0 && block.timestamp >= opportunityWindowEnd) {
            _autoLockIfWindowPassed();
            revert TradingClosed();
        }
        _autoLockIfWindowPassed();
        if (state != State.Trading) revert InvalidState(state);
        if (msg.sender == sponsor) revert SponsorTradingBlocked();
        if (collateralIn == 0 || minYesOut == 0 || maxPrice == 0) revert ZeroAmount();

        yesOut = (option.reserveYes * collateralIn) / (option.reserveCollateral + collateralIn);
        if (yesOut == 0 || yesOut < minYesOut) revert SlippageTooHigh();

        uint256 executionPrice = (collateralIn * PRICE_SCALE) / yesOut;
        if (executionPrice > maxPrice) revert PriceTooHigh();

        collateral.safeTransferFrom(msg.sender, address(this), collateralIn);

        option.reserveCollateral += collateralIn;
        option.reserveYes -= yesOut;
        option.k = option.reserveCollateral * option.reserveYes;

        _yesBalance[optionId][msg.sender] += yesOut;
        _stakeByOption[optionId][msg.sender] += collateralIn;
        _stakeAmount[msg.sender] += collateralIn;
        option.totalYesShares += yesOut;
        option.totalStake += collateralIn;
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

    function resolveYes(uint256 optionId) external override onlyOwner {
        _autoLockIfWindowPassed();
        if (state != State.Locked) revert InvalidState(state);
        Option storage winner = _optionOrRevert(optionId);

        state = State.ResolvedYes;
        hasWinningOption = true;
        winningOptionId = optionId;

        uint256 len = _options.length;
        for (uint256 i = 0; i < len; ++i) {
            if (i == optionId) continue;
            _options[i].totalYesShares = 0;
        }

        totalYesShares = winner.totalYesShares;
        emit Resolve(State.ResolvedYes);
    }

    function resolveNo() external override onlyOwner {
        _autoLockIfWindowPassed();
        if (state != State.Locked) revert InvalidState(state);
        state = State.ResolvedNo;

        penaltyAvailable = (totalStake * penaltyBps) / MAX_BPS;
        refundLiability = totalStake - penaltyAvailable;

        uint256 len = _options.length;
        for (uint256 i = 0; i < len; ++i) {
            _options[i].totalYesShares = 0;
        }
        totalYesShares = 0;
        hasWinningOption = false;

        emit Resolve(State.ResolvedNo);
    }

    function claimYes(uint256 optionId) external override nonReentrant returns (uint256 collateralOut) {
        if (state != State.ResolvedYes) revert InvalidState(state);
        if (!hasWinningOption || optionId != winningOptionId) revert InvalidOption(optionId);

        uint256 balance = _yesBalance[optionId][msg.sender];
        if (balance == 0) revert NothingToClaim();

        uint256 stake = _stakeByOption[optionId][msg.sender];

        _yesBalance[optionId][msg.sender] = 0;
        _stakeByOption[optionId][msg.sender] = 0;

        Option storage winner = _options[optionId];
        winner.totalYesShares -= balance;
        totalYesShares -= balance;

        if (stake != 0) {
            winner.totalStake -= stake;
            totalStake -= stake;
            _stakeAmount[msg.sender] -= stake;
        }

        collateralOut = balance;
        collateral.safeTransfer(msg.sender, collateralOut);

        emit YesClaimed(msg.sender, optionId, collateralOut);
    }

    function claimNo() external override nonReentrant returns (uint256 refundOut) {
        if (state != State.ResolvedNo) revert InvalidState(state);

        uint256 stake = _stakeAmount[msg.sender];
        if (stake == 0) revert NothingToClaim();

        uint256 penalty = (stake * penaltyBps) / MAX_BPS;
        refundOut = stake - penalty;

        uint256 len = _options.length;
        for (uint256 i = 0; i < len; ++i) {
            uint256 balance = _yesBalance[i][msg.sender];
            if (balance != 0) {
                _yesBalance[i][msg.sender] = 0;
                Option storage opt = _options[i];
                if (opt.totalYesShares >= balance) {
                    opt.totalYesShares -= balance;
                }
                if (totalYesShares >= balance) {
                    totalYesShares -= balance;
                }
            }

            uint256 stakeShare = _stakeByOption[i][msg.sender];
            if (stakeShare != 0) {
                _stakeByOption[i][msg.sender] = 0;
                Option storage optStake = _options[i];
                if (optStake.totalStake >= stakeShare) {
                    optStake.totalStake -= stakeShare;
                }
            }
        }

        _stakeAmount[msg.sender] = 0;

        totalStake -= stake;
        refundLiability -= refundOut;

        collateral.safeTransfer(msg.sender, refundOut);

        emit NoClaimed(msg.sender, refundOut, penalty);
    }

    function claimSponsorPayout() external override onlyOwner nonReentrant returns (uint256 amountOut) {
        if (state == State.ResolvedYes) {
            if (!hasWinningOption) revert InvalidState(state);
            if (_options[winningOptionId].totalYesShares != 0) revert OutstandingClaims();
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

    function yesBalance(address user, uint256 optionId) external view override returns (uint256) {
        _ensureValidOption(optionId);
        return _yesBalance[optionId][user];
    }

    function stakeAmount(address user) external view override returns (uint256) {
        return _stakeAmount[user];
    }

    function stakeAmount(address user, uint256 optionId) external view override returns (uint256) {
        _ensureValidOption(optionId);
        return _stakeByOption[optionId][user];
    }

    function optionCount() external view override returns (uint256) {
        return _options.length;
    }

    function getReserves(uint256 optionId)
        external
        view
        override
        returns (uint256 collateralReserve, uint256 virtualYesReserve)
    {
        Option storage option = _optionOrRevert(optionId);
        collateralReserve = option.reserveCollateral;
        virtualYesReserve = option.reserveYes;
    }

    function getOption(uint256 optionId)
        external
        view
        override
        returns (IOpportunityMarket.OptionView memory viewData)
    {
        Option storage option = _optionOrRevert(optionId);
        viewData = IOpportunityMarket.OptionView({
            optionHash: option.optionHash,
            collateralReserve: option.reserveCollateral,
            virtualYesReserve: option.reserveYes,
            totalYesShares: option.totalYesShares,
            totalStake: option.totalStake
        });
    }

    function _autoLockIfWindowPassed() internal {
        if (
            state == State.Trading && opportunityWindowEnd != 0 && block.timestamp >= opportunityWindowEnd
        ) {
            state = State.Locked;
            emit Locked(block.timestamp);
        }
    }

    function _optionOrRevert(uint256 optionId) internal view returns (Option storage) {
        if (optionId >= _options.length) revert InvalidOption(optionId);
        return _options[optionId];
    }

    function _ensureValidOption(uint256 optionId) internal view {
        if (optionId >= _options.length) revert InvalidOption(optionId);
    }
}
