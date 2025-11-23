// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {USDCToken} from "../src/USDCToken.sol";

contract DeployUSDC is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        USDCToken token = new USDCToken();
        vm.stopBroadcast();

        console2.log("USDC (demo) token deployed at", address(token));
        console2.log("Initial supply", token.totalSupply());
    }
}
