// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {OpportunityFactory} from "../src/OpportunityFactory.sol";
import {USDCToken} from "../src/USDCToken.sol";

/// @notice Deploys the demo USDC token and the OpportunityFactory in a single broadcast.
contract DeployAll is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        USDCToken usdc = new USDCToken();
        OpportunityFactory factory = new OpportunityFactory(owner);

        vm.stopBroadcast();

        console2.log("USDC (demo) token deployed at", address(usdc));
        console2.log("Initial supply", usdc.totalSupply());
        console2.log("OpportunityFactory deployed at", address(factory));
    }
}
