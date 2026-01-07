import { createPublicClient, http, webSocket, parseAbiItem } from 'viem';
import { connectDB } from '../db/mongodb';
import { User } from '../db/models/User';
import { Transaction } from '../db/models/Transaction';
import { DepositABI } from '@/abis/Deposit';

const DEPOSIT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DEPOST_ADDRESS || '0x320E6049a8806295aF8Dd6F1D6Df708474059825') as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';
const WS_URL = process.env.WS_URL;
const POLL_INTERVAL = 5000; // 5 seconds

// Define Mantle Sepolia chain
const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  network: 'mantle-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
    public: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.mantlescan.xyz',
    },
  },
  testnet: true,
};

interface DepositedEvent {
  player: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
}

export class DepositEventListener {
  private httpClient: ReturnType<typeof createPublicClient>;
  private wsClient: ReturnType<typeof createPublicClient> | null = null;
  private isRunning = false;
  private lastProcessedBlock = BigInt(0);
  private pollingInterval: NodeJS.Timeout | null = null;
  private useWebSocket = false;

  constructor() {
    console.log('📡 Initializing Event Listener...');
    console.log(`   Contract: ${DEPOSIT_CONTRACT_ADDRESS}`);
    console.log(`   RPC: ${RPC_URL}`);
    console.log(`   WS: ${WS_URL || 'Not configured - using HTTP polling'}`);
    
    this.httpClient = createPublicClient({
      chain: mantleSepolia as any,
      transport: http(RPC_URL),
    });

    // Check if WebSocket is available
    this.useWebSocket = !!WS_URL;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Event listener already running');
      return;
    }

    try {
      console.log('🚀 Starting Deposit Event Listener...');
      
      // Connect to MongoDB
      console.log('📦 Connecting to MongoDB...');
      await connectDB();
      console.log('✅ Connected to MongoDB');

      // Get current block
      const currentBlock = await this.httpClient.getBlockNumber();
      console.log(`📊 Current block: ${currentBlock}`);

      // Set start block from env or use recent blocks
      const startBlock = process.env.START_BLOCK 
        ? BigInt(process.env.START_BLOCK)
        : currentBlock - BigInt(1000); // Last 1000 blocks

      this.lastProcessedBlock = startBlock;
      console.log(`📜 Starting from block: ${startBlock}`);

      // Sync historical events
      await this.syncHistoricalEvents(startBlock, currentBlock);

      // Start listening
      if (this.useWebSocket) {
        console.log('🔌 Starting WebSocket listener...');
        await this.startWebSocketListener();
      } else {
        console.log('🔄 Starting HTTP polling (5s interval)...');
        this.startPolling();
      }

      this.isRunning = true;
      console.log('✅ Event listener started successfully\n');
    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      throw error;
    }
  }

  private async syncHistoricalEvents(fromBlock: bigint, toBlock: bigint) {
    console.log(`📜 Syncing events from block ${fromBlock} to ${toBlock}...`);
    
    try {
      const logs = await this.httpClient.getLogs({
        address: DEPOSIT_CONTRACT_ADDRESS,
        event: parseAbiItem('event Deposited(address indexed player, uint256 amount, uint256 timestamp)'),
        fromBlock,
        toBlock,
      });

      console.log(`📋 Found ${logs.length} historical deposit events`);

      for (const log of logs) {
        await this.processDepositEvent(log);
      }

      console.log('✅ Historical sync complete\n');
      this.lastProcessedBlock = toBlock;
    } catch (error) {
      console.error('❌ Error syncing historical events:', error);
      console.log('⚠️  Continuing with real-time monitoring...\n');
    }
  }

  private startPolling() {
    this.pollingInterval = setInterval(async () => {
      try {
        const currentBlock = await this.httpClient.getBlockNumber();
        
        if (currentBlock > this.lastProcessedBlock) {
          const logs = await this.httpClient.getLogs({
            address: DEPOSIT_CONTRACT_ADDRESS,
            event: parseAbiItem('event Deposited(address indexed player, uint256 amount, uint256 timestamp)'),
            fromBlock: this.lastProcessedBlock + BigInt(1),
            toBlock: currentBlock,
          });

          if (logs.length > 0) {
            console.log(`🔔 Found ${logs.length} new deposit(s) in blocks ${this.lastProcessedBlock + BigInt(1)} to ${currentBlock}`);
            
            for (const log of logs) {
              await this.processDepositEvent(log);
            }
          }

          this.lastProcessedBlock = currentBlock;
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, POLL_INTERVAL);
  }

  private async startWebSocketListener() {
    try {
      if (!WS_URL) {
        throw new Error('WebSocket URL not configured');
      }

      this.wsClient = createPublicClient({
        chain: mantleSepolia as any,
        transport: webSocket(WS_URL),
      });

      console.log('✅ WebSocket connected');

      this.wsClient.watchContractEvent({
        address: DEPOSIT_CONTRACT_ADDRESS,
        abi: DepositABI,
        eventName: 'Deposited',
        onLogs: async (logs) => {
          console.log(`🔔 Received ${logs.length} new deposit event(s)`);
          for (const log of logs) {
            await this.processDepositEvent(log);
          }
        },
        onError: (error) => {
          console.error('❌ WebSocket error:', error);
          console.log('🔄 Falling back to HTTP polling...');
          this.useWebSocket = false;
          this.startPolling();
        },
      });
    } catch (error) {
      console.error('❌ WebSocket setup failed:', error);
      console.log('🔄 Falling back to HTTP polling...');
      this.useWebSocket = false;
      this.startPolling();
    }
  }

  private async processDepositEvent(log: any) {
    try {
      const { player, amount, timestamp } = log.args as DepositedEvent;
      const txHash = log.transactionHash;
      const blockNumber = log.blockNumber;

      console.log(`\n💰 Processing Deposit:`);
      console.log(`   Player: ${player}`);
      console.log(`   Amount: ${amount.toString()} wei`);
      console.log(`   Block: ${blockNumber}`);
      console.log(`   Tx: ${txHash}`);

      // Check if already processed
      const existingTx = await Transaction.findOne({ txHash });
      if (existingTx) {
        console.log('   ⚠️  Already processed, skipping\n');
        return;
      }

      // Update user balance
      const user = await User.findOne({ address: player.toLowerCase() });
      
      if (user) {
        const oldBalance = user.balance;
        const newBalance = (BigInt(user.balance) + amount).toString();
        user.balance = newBalance;
        user.lastUpdated = new Date();
        await user.save();
        console.log(`   ✅ Updated balance: ${oldBalance} → ${newBalance}`);
      } else {
        await User.create({
          address: player.toLowerCase(),
          balance: amount.toString(),
          lastUpdated: new Date(),
        });
        console.log(`   ✅ Created new user with balance: ${amount.toString()}`);
      }

      // Record transaction
      await Transaction.create({
        address: player.toLowerCase(),
        amount: amount.toString(),
        txHash,
        blockNumber,
        timestamp: new Date(Number(timestamp) * 1000),
      });

      console.log('   ✅ Transaction recorded in DB\n');
    } catch (error) {
      console.error('❌ Error processing deposit event:', error);
      console.error('   Log data:', log);
    }
  }

  async stop() {
    console.log('\n🛑 Stopping event listener...');
    this.isRunning = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.wsClient = null;
    console.log('✅ Event listener stopped\n');
  }
}
