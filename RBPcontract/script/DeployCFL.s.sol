// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CFL} from "../src/CFL.sol";

/**
 * @title DeployCFL
 * @notice Script to deploy the CFL contract to Monad network
 */
contract DeployCFL is Script {
    function run() external returns (CFL cfl) {
        // Get deployment parameters from environment variables
        address owner;
        uint256 deployerPrivateKey;

        // Get deployer private key
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            revert("PRIVATE_KEY environment variable must be set");
        }

        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);

        // Get owner address (defaults to deployer if not set)
        try vm.envAddress("OWNER_ADDRESS") returns (address _owner) {
            owner = _owner;
        } catch {
            owner = deployer;
        }

        console.log("Deploying CFL contract to Monad...");
        console.log("Using native tokens (ETH/MON)");
        console.log("Owner address:", owner);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CFL contract (no token address needed - uses native tokens)
        cfl = new CFL(owner);

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Network: Monad");
        console.log("CFL contract deployed at:", address(cfl));
        console.log("Token: Native (ETH/MON)");
        console.log("Owner address:", owner);
        console.log("Deployer address:", deployer);
        console.log("===========================\n");

        return cfl;
    }
}

