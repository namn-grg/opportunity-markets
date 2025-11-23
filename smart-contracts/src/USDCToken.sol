// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title USDCToken
 * @notice Simple fixed-supply ERC20 (named USDC for the demo) for use as collateral/liquidity.
 *         Mints the entire supply to the deployer.
 */
contract USDCToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;

    constructor() ERC20("USDC", "USDC") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
