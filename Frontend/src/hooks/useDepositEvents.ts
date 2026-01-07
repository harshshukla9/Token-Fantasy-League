import { useWatchContractEvent } from 'wagmi';
import { DepositABI } from '@/abis/Deposit';
import { CONTRACT_ADDRESSES } from '@/shared/constants';
import type { Log } from 'viem';

interface DepositEvent {
  player: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
}

interface UseDepositEventsOptions {
  onDeposit?: (event: DepositEvent) => void | Promise<void>;
  enabled?: boolean;
}

interface DepositedLog extends Log {
  args: {
    player: `0x${string}`;
    amount: bigint;
    timestamp: bigint;
  };
}

export function useDepositEvents({ onDeposit, enabled = true }: UseDepositEventsOptions = {}) {
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.DEPOSIT as `0x${string}`,
    abi: DepositABI,
    eventName: 'Deposited',
    enabled,
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const decodedLog = log as DepositedLog;
          const { player, amount, timestamp } = decodedLog.args;
          
          if (!player || !amount || !timestamp) {
            console.warn('Invalid deposit event:', decodedLog);
            continue;
          }

          const event: DepositEvent = {
            player,
            amount,
            timestamp,
            transactionHash: decodedLog.transactionHash as `0x${string}`,
            blockNumber: decodedLog.blockNumber as bigint ,
          };

          console.log('💰 Deposit event detected:', {
            player: event.player,
            amount: event.amount.toString(),
            tx: event.transactionHash,
          });

          if (onDeposit) {
            await onDeposit(event);
          }
        } catch (error) {
          console.error('Error processing deposit event:', error);
        }
      }
    },
  });
}

