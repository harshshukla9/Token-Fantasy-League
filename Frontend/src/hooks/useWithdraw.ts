'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, Address, Hex } from 'viem';
import OnchainWithdraw from '@/abis/OnchainWithdraw';

export type WithdrawStatus = 
  | 'idle'
  | 'requesting' 
  | 'signing' 
  | 'confirming' 
  | 'recording'
  | 'success' 
  | 'error';

interface WithdrawResult {
  txHash: string;
  amount: string;
  status: 'success' | 'failed';
}

interface UseWithdrawReturn {
  withdraw: (amount: string) => Promise<void>;
  status: WithdrawStatus;
  error: string | null;
  txHash: string | null;
  result: WithdrawResult | null;
  reset: () => void;
}

export function useWithdraw(onSuccess?: (result: WithdrawResult) => void): UseWithdrawReturn {
  const { address } = useAccount();
  const [status, setStatus] = useState<WithdrawStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [result, setResult] = useState<WithdrawResult | null>(null);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);

  // Wagmi hooks for contract interaction
  const { 
    writeContract, 
    data: writeData,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
    setResult(null);
    setPendingAmount(null);
    resetWrite();
  }, [resetWrite]);

  const withdraw = useCallback(async (amountInEth: string) => {
    if (!address) {
      setError('Wallet not connected');
      setStatus('error');
      return;
    }

    try {
      reset();
      setStatus('requesting');

      // Convert ETH amount to wei
      const amountWei = parseEther(amountInEth);
      setPendingAmount(amountWei.toString());

      // Step 1: Request withdrawal from backend (deducts balance and gets signature)
      const requestResponse = await fetch('/api/withdraw/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          amount: amountWei.toString(),
        }),
      });

      const requestData = await requestResponse.json();

      if (!requestResponse.ok) {
        throw new Error(requestData.error || 'Failed to request withdrawal');
      }

      const { nonce, signature, amount } = requestData;

      // Step 2: Call the smart contract to claim withdrawal
      setStatus('signing');

      writeContract({
        address: OnchainWithdraw.address as Address,
        abi: OnchainWithdraw.abi,
        functionName: 'claimWithdrawal',
        args: [BigInt(amount), BigInt(nonce), signature as Hex],
      }, {
        onSuccess: async (hash) => {
          setTxHash(hash);
          setStatus('confirming');
        },
        onError: async (err) => {
          // If contract call fails, restore balance
          try {
            await fetch('/api/withdraw/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address,
                amount: amount,
              }),
            });
          } catch (cancelError) {
            console.error('Failed to restore balance:', cancelError);
          }
          
          setError(err.message || 'Transaction failed');
          setStatus('error');
        },
      });
    } catch (err) {
      // If request fails before contract call, try to restore balance
      if (pendingAmount) {
        try {
          await fetch('/api/withdraw/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address,
              amount: pendingAmount,
            }),
          });
        } catch (cancelError) {
          console.error('Failed to restore balance:', cancelError);
        }
      }

      setError(err instanceof Error ? err.message : 'Withdrawal failed');
      setStatus('error');
    }
  }, [address, reset, writeContract, pendingAmount]);

  // Handle transaction confirmation
  const confirmTransaction = useCallback(async () => {
    if (!isConfirmed || !writeData || !address || !pendingAmount) return;

    try {
      setStatus('recording');

      // Record the successful withdrawal in transaction history
      const confirmResponse = await fetch('/api/withdraw/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          amount: pendingAmount,
          txHash: writeData,
        }),
      });

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok) {
        console.error('Failed to record transaction:', confirmData.error);
      }

      const withdrawResult: WithdrawResult = {
        txHash: writeData,
        amount: pendingAmount,
        status: 'success',
      };

      setResult(withdrawResult);
      setStatus('success');
      onSuccess?.(withdrawResult);
    } catch (err) {
      console.error('Failed to confirm transaction:', err);
      // Transaction was successful on-chain, just failed to record
      const withdrawResult: WithdrawResult = {
        txHash: writeData,
        amount: pendingAmount,
        status: 'success',
      };
      setResult(withdrawResult);
      setStatus('success');
      onSuccess?.(withdrawResult);
    }
  }, [isConfirmed, writeData, address, pendingAmount, onSuccess]);

  // Effect to handle confirmation (called when isConfirmed changes)
  // We use a ref pattern to avoid calling confirmTransaction in useEffect
  if (isConfirmed && writeData && status === 'confirming') {
    confirmTransaction();
  }

  // Handle write error
  if (writeError && status !== 'error') {
    setError(writeError.message || 'Transaction failed');
    setStatus('error');
  }

  return {
    withdraw,
    status,
    error,
    txHash: writeData || txHash,
    result,
    reset,
  };
}

