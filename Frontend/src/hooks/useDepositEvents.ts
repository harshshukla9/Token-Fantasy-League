import { useEffect } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { DepositABI } from '@/abis/Deposit';
import { CONTRACT_ADDRESSES } from '@/shared/constants';

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

export function useDepositEvents({ onDeposit, enabled = true }: UseDepositEventsOptions = {}) {
  const publicClient = usePublicClient();

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.DEPOSIT as `0x${string}`,
    abi: DepositABI,
    eventName: 'Deposited',
    enabled,
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { player, amount, timestamp } = log.args as any;
          
          if (!player || !amount || !timestamp) {
            console.warn('Invalid deposit event:', log);
            continue;
          }

          const event: DepositEvent = {
            player: player as `0x${string}`,
            amount: BigInt(amount.toString()),
            timestamp: BigInt(timestamp.toString()),
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
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

