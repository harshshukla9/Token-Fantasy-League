#!/usr/bin/env tsx

/**
 * Test Event Listener
 * 
 * This script tests if the event listener can connect and fetch events
 */

import { createPublicClient, http, parseAbiItem } from 'viem';

const DEPOSIT_CONTRACT_ADDRESS = '0x320E6049a8806295aF8Dd6F1D6Df708474059825';
const RPC_URL = 'https://rpc.sepolia.mantle.xyz';

const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  testnet: true,
};

async function testListener() {
  console.log('═══════════════════════════════════════════════');
  console.log('🧪 Testing Event Listener Connection');
  console.log('═══════════════════════════════════════════════\n');

  try {
    console.log('1️⃣  Creating RPC client...');
    const client = createPublicClient({
      chain: mantleSepolia as any,
      transport: http(RPC_URL),
    });
    console.log('✅ Client created\n');

    console.log('2️⃣  Fetching current block number...');
    const currentBlock = await client.getBlockNumber();
    console.log(`✅ Current block: ${currentBlock}\n`);

    console.log('3️⃣  Fetching recent deposit events (last 5000 blocks)...');
    const fromBlock = currentBlock - BigInt(5000);
    
    const logs = await client.getLogs({
      address: DEPOSIT_CONTRACT_ADDRESS as `0x${string}`,
      event: parseAbiItem('event Deposited(address indexed player, uint256 amount, uint256 timestamp)'),
      fromBlock,
      toBlock: currentBlock,
    });

    console.log(`✅ Found ${logs.length} deposit events\n`);

    if (logs.length > 0) {
      console.log('📋 Recent Deposits:');
      console.log('═══════════════════════════════════════════════\n');
      
      logs.slice(-5).forEach((log, index) => {
        const { player, amount, timestamp } = log.args as any;
        console.log(`${index + 1}. Player: ${player}`);
        console.log(`   Amount: ${amount.toString()} wei`);
        console.log(`   Block: ${log.blockNumber}`);
        console.log(`   Tx: ${log.transactionHash}`);
        console.log(`   Time: ${new Date(Number(timestamp) * 1000).toLocaleString()}\n`);
      });
    } else {
      console.log('⚠️  No deposit events found in the last 5000 blocks');
      console.log('   This might mean:');
      console.log('   - No deposits have been made yet');
      console.log('   - The contract address is incorrect');
      console.log('   - The contract was deployed after block ' + fromBlock);
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ Test completed successfully!');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testListener();

