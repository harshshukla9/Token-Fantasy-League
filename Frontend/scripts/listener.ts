#!/usr/bin/env tsx

/**
 * Event Listener Script
 * 
 * This script runs continuously to listen for Deposited events
 * from the Deposit contract and updates the MongoDB database.
 * 
 * Run with: npm run listener
 */

import { DepositEventListener } from '../src/lib/services/eventListener';

async function main() {
  console.log('='.repeat(50));
  console.log('🎧 CFL Deposit Event Listener');
  console.log('='.repeat(50));
  console.log();

  const listener = new DepositEventListener();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    await listener.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    await listener.stop();
    process.exit(0);
  });

  try {
    await listener.start();
  } catch (error) {
    console.error('❌ Failed to start event listener:', error);
    process.exit(1);
  }
}

main();

