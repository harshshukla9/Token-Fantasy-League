'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { CFL_ABI } from '@/abis/CFL';
import { CONTRACT_ADDRESSES } from '@/shared/constants';
import { Address } from 'viem';

const CFL_ADDRESS = CONTRACT_ADDRESSES.CFL as `0x${string}`;

// ============================================
// READ HOOKS
// ============================================

/**
 * Get user's deposit information (deposit amount, pending rewards, claimed rewards)
 */
export function useUserInfo(userAddress?: Address) {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'getUserInfo',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Get user's total balance (deposits + pending rewards)
 */
export function useUserBalance(userAddress?: Address) {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'getUserBalance',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Get user's claimable rewards
 */
export function useClaimableRewards(userAddress?: Address) {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'getClaimableRewards',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Get user's deposit amount
 */
export function useUserDeposits(userAddress?: Address) {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'userDeposits',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Get user's pending rewards
 */
export function useUserPendingRewards(userAddress?: Address) {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'userPendingRewards',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Get user's claimed rewards
 */
export function useUserClaimedRewards(userAddress?: Address) {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'userClaimedRewards',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Get contract's native token balance
 */
export function useContractBalance() {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'getContractBalance',
  });
}

/**
 * Get total deposits across all users
 */
export function useTotalDeposits() {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'totalDeposits',
  });
}

/**
 * Get total pending rewards
 */
export function useTotalPendingRewards() {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'totalPendingRewards',
  });
}

/**
 * Get total rewards distributed
 */
export function useTotalRewardsDistributed() {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'totalRewardsDistributed',
  });
}

/**
 * Get contract owner address
 */
export function useCFLOwner() {
  return useReadContract({
    address: CFL_ADDRESS,
    abi: CFL_ABI,
    functionName: 'owner',
  });
}

// ============================================
// WRITE HOOKS
// ============================================

/**
 * Deposit native tokens into the contract
 * Note: This uses sendTransaction since deposit() is payable
 */
export function useDeposit() {
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction();
  
  const deposit = (value: bigint) => {
    sendTransaction({
      to: CFL_ADDRESS,
      value,
    });
  };

  return {
    deposit,
    hash,
    isPending,
    error,
  };
}

/**
 * Claim pending rewards
 */
export function useClaimReward() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const claimReward = () => {
    writeContract({
      address: CFL_ADDRESS,
      abi: CFL_ABI,
      functionName: 'claimReward',
    });
  };

  return {
    claimReward,
    hash,
    isPending,
    error,
  };
}

/**
 * Add reward to a user (owner only)
 */
export function useAddReward() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const addReward = (user: Address, amount: bigint) => {
    writeContract({
      address: CFL_ADDRESS,
      abi: CFL_ABI,
      functionName: 'addReward',
      args: [user, amount],
    });
  };

  return {
    addReward,
    hash,
    isPending,
    error,
  };
}

/**
 * Batch add rewards to multiple users (owner only)
 */
export function useBatchAddRewards() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const batchAddRewards = (users: Address[], amounts: bigint[]) => {
    writeContract({
      address: CFL_ADDRESS,
      abi: CFL_ABI,
      functionName: 'batchAddRewards',
      args: [users, amounts],
    });
  };

  return {
    batchAddRewards,
    hash,
    isPending,
    error,
  };
}

/**
 * Withdraw native tokens from contract (owner only)
 */
export function useWithdraw() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const withdraw = (to: Address, amount: bigint) => {
    writeContract({
      address: CFL_ADDRESS,
      abi: CFL_ABI,
      functionName: 'withdraw',
      args: [to, amount],
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    error,
  };
}

/**
 * Emergency withdraw all tokens (owner only)
 */
export function useEmergencyWithdraw() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const emergencyWithdraw = (to: Address) => {
    writeContract({
      address: CFL_ADDRESS,
      abi: CFL_ABI,
      functionName: 'emergencyWithdraw',
      args: [to],
    });
  };

  return {
    emergencyWithdraw,
    hash,
    isPending,
    error,
  };
}

// ============================================
// TRANSACTION STATUS HOOKS
// ============================================

/**
 * Wait for deposit transaction receipt
 */
export function useWaitForDeposit(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
  });
}

/**
 * Wait for claim reward transaction receipt
 */
export function useWaitForClaimReward(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
  });
}

/**
 * Wait for any transaction receipt
 */
export function useWaitForTransaction(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
  });
}

// ============================================
// COMBINED HOOKS
// ============================================

/**
 * Combined hook for deposit with transaction status
 */
export function useDepositWithStatus() {
  const depositHook = useDeposit();
  const { isLoading: isConfirming, isSuccess } = useWaitForDeposit(depositHook.hash);

  return {
    ...depositHook,
    isConfirming,
    isSuccess,
  };
}

/**
 * Combined hook for claim reward with transaction status
 */
export function useClaimRewardWithStatus() {
  const claimHook = useClaimReward();
  const { isLoading: isConfirming, isSuccess } = useWaitForClaimReward(claimHook.hash);

  return {
    ...claimHook,
    isConfirming,
    isSuccess,
  };
}

