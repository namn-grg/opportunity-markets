// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {PREDToken} from "../src/PREDToken.sol";

contract DeployPRED is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        PREDToken token = new PREDToken();
        vm.stopBroadcast();

        console2.log("PREDToken deployed at", address(token));
        console2.log("Initial supply", token.totalSupply());
    }
}
