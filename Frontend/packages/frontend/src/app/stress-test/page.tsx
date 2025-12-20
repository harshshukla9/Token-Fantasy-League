'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ACTION_TYPES, ACTION_LABELS, CONTRACT_ADDRESSES } from '@/shared';
import { useWriteContract, useAccount, useSendTransaction } from 'wagmi';
import { ReputationRegistryABI } from '@/abis/ReputationRegistry';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { monadTestnet } from '@/config/wagmi';
import { sendRawTransactionSync } from '@/utils/rpc';

interface StressTestConfig {
  numTransactions: number;
  batchSize: number;
  delayMs: number;
  selectedActions: number[];
  useHighPerformance: boolean;
}

interface TestResults {
  status: string;
  totalTransactions: number;
  successCount: number;
  failureCount: number;
  avgConfirmTime: number;
  throughput: number;
  startTime: string;
  endTime?: string;
}

export default function StressTestPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [config, setConfig] = useState<StressTestConfig>({
    numTransactions: 10,
    batchSize: 5,
    delayMs: 100,
    selectedActions: [ACTION_TYPES.FOLLOW, ACTION_TYPES.LIKE, ACTION_TYPES.BOOST],
    useHighPerformance: false,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  // Burner Wallet State
  const [burnerPrivateKey, setBurnerPrivateKey] = useState<`0x${string}` | null>(null);
  const [burnerAddress, setBurnerAddress] = useState<string>('');
  const [burnerBalance, setBurnerBalance] = useState<string>('0');

  useEffect(() => {
    // Generate burner wallet on mount if not exists
    const storedKey = localStorage.getItem('burnerPrivateKey');
    if (storedKey) {
      setBurnerPrivateKey(storedKey as `0x${string}`);
      const account = privateKeyToAccount(storedKey as `0x${string}`);
      setBurnerAddress(account.address);
      fetchBurnerBalance(account.address);
    } else {
      const newKey = generatePrivateKey();
      setBurnerPrivateKey(newKey);
      localStorage.setItem('burnerPrivateKey', newKey);
      const account = privateKeyToAccount(newKey);
      setBurnerAddress(account.address);
      fetchBurnerBalance(account.address);
    }
  }, []);

  const fetchBurnerBalance = async (addr: string) => {
    try {
      // Simple fetch for balance using public RPC
      const response = await fetch(monadTestnet.rpcUrls.default.http[0], {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [addr, 'latest']
        })
      });
      const data = await response.json();
      if (data.result) {
        setBurnerBalance(formatEther(BigInt(data.result)));
      }
    } catch (e) {
      console.error('Failed to fetch burner balance', e);
    }
  };

  const fundBurnerWallet = async () => {
    if (!burnerAddress) return;
    try {
      addLog('Funding burner wallet with 0.1 MON...');
      const hash = await sendTransactionAsync({
        to: burnerAddress as `0x${string}`,
        value: parseEther('0.1'),
      });
      addLog(`Funding tx sent: ${hash}`);
      // Wait a bit and refresh balance
      setTimeout(() => fetchBurnerBalance(burnerAddress), 5000);
    } catch (e: any) {
      setError(`Failed to fund: ${e.message}`);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), msg]);
  };

  const handleActionToggle = (actionType: number) => {
    setConfig(prev => ({
      ...prev,
      selectedActions: prev.selectedActions.includes(actionType)
        ? prev.selectedActions.filter(a => a !== actionType)
        : [...prev.selectedActions, actionType]
    }));
  };

  const handleStartTest = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    if (config.selectedActions.length === 0) {
      setError('Please select at least one action type');
      return;
    }

    if (config.useHighPerformance && parseFloat(burnerBalance) < 0.001) {
      setError('Burner wallet needs funds. Please fund it first.');
      return;
    }

    setIsRunning(true);
    setError('');
    setProgress(0);
    setResults(null);
    setLogs([]);

    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;
    let totalSent = 0;

    try {
      addLog(`Starting ${config.useHighPerformance ? 'HIGH PERF' : 'NORMAL'} stress test: ${config.numTransactions} txs...`);

      // Setup for High Performance Mode
      let burnerClient;
      let currentNonce = 0;
      if (config.useHighPerformance && burnerPrivateKey) {
        const account = privateKeyToAccount(burnerPrivateKey);
        burnerClient = createWalletClient({
          account,
          chain: monadTestnet,
          transport: http()
        });

        // Ensure burner wallet is registered
        const publicClient = createPublicClient({
          chain: monadTestnet,
          transport: http()
        });

        try {
          // Hardcoded address from deployment artifacts since env var might be missing
          const REGISTRY_ADDRESS = '0xd3fb5f3c6e5715b37dd54e4fbfb23c86b1fc8d4e';

          const isRegistered = await publicClient.readContract({
            address: REGISTRY_ADDRESS as `0x${string}`,
            abi: ReputationRegistryABI,
            functionName: 'isRegistered',
            args: [account.address]
          });

          if (!isRegistered) {
            addLog('Registering burner wallet...');
            const randomName = `burner${Date.now().toString().slice(-8)}`;

            const hash = await burnerClient.sendTransaction({
              to: REGISTRY_ADDRESS as `0x${string}`,
              data: encodeFunctionData({
                abi: ReputationRegistryABI,
                functionName: 'registerUser',
                args: [randomName, 'Stress Test Burner', '']
              }),
              chain: monadTestnet,
              account
            });

            addLog(`Registration tx sent: ${hash.slice(0, 10)}...`);
            await publicClient.waitForTransactionReceipt({ hash });
            addLog('Burner wallet registered!');
          }

          // Fetch initial nonce for manual management
          currentNonce = await publicClient.getTransactionCount({ address: account.address });
          addLog(`Initial nonce: ${currentNonce}`);
        } catch (e: any) {
          console.error('Registration/Nonce failed:', e);
          throw new Error(`Failed to setup burner wallet: ${e.message}`);
        }
      }

      // We will send transactions in batches
      for (let i = 0; i < config.numTransactions; i += config.batchSize) {
        const batchEnd = Math.min(i + config.batchSize, config.numTransactions);
        const batchPromises = [];

        addLog(`Sending batch ${i + 1}-${batchEnd}...`);

        for (let j = i; j < batchEnd; j++) {
          // Randomly select an action type (though for updateProfile we just change bio)
          // To make it "stressful", we just spam updateProfile with random data
          const randomBio = `Stress Test ${Date.now()} - ${Math.random()}`;

          if (config.useHighPerformance && burnerClient) {
            // High Performance: Sign locally and send raw sync
            const nonce = currentNonce++; // Capture and increment nonce synchronously

            batchPromises.push(
              (async () => {
                try {
                  // Prepare transaction
                  const REGISTRY_ADDRESS = '0xd3fb5f3c6e5715b37dd54e4fbfb23c86b1fc8d4e';
                  const request = await burnerClient.prepareTransactionRequest({
                    account: burnerClient.account,
                    to: REGISTRY_ADDRESS as `0x${string}`,
                    data: encodeFunctionData({
                      abi: ReputationRegistryABI,
                      functionName: 'updateProfile',
                      args: [randomBio, '']
                    }),
                    chain: monadTestnet,
                    nonce: nonce
                  });

                  // Sign transaction
                  const signedTx = await burnerClient.signTransaction(request);

                  // Send raw sync
                  const hash = await sendRawTransactionSync(monadTestnet.rpcUrls.default.http[0], signedTx);

                  successCount++;
                  if (hash && typeof hash === 'string') {
                    addLog(`HP Tx sent: ${hash.slice(0, 10)}... (Nonce: ${nonce})`);
                  } else {
                    addLog(`HP Tx sent (Nonce: ${nonce})`);
                  }
                  return hash;
                } catch (err: any) {
                  failureCount++;
                  console.error(err);
                  addLog(`HP Tx failed: ${err.message.slice(0, 20)}...`);
                }
              })()
            );
          } else {
            // Normal Mode: MetaMask
            const REGISTRY_ADDRESS = '0xd3fb5f3c6e5715b37dd54e4fbfb23c86b1fc8d4e';
            batchPromises.push(
              writeContractAsync({
                address: REGISTRY_ADDRESS as `0x${string}`,
                abi: ReputationRegistryABI,
                functionName: 'updateProfile',
                args: [randomBio, ''],
              }).then((hash) => {
                successCount++;
                addLog(`Tx sent: ${hash.slice(0, 10)}...`);
                return hash;
              }).catch((err) => {
                failureCount++;
                console.error(err);
                addLog(`Tx failed: ${err.message.slice(0, 20)}...`);
              })
            );
          }

          totalSent++;
        }

        // Wait for batch to be submitted (not necessarily confirmed)
        await Promise.all(batchPromises);

        const currentProgress = Math.floor((totalSent / config.numTransactions) * 100);
        setProgress(currentProgress);

        if (config.delayMs > 0 && batchEnd < config.numTransactions) {
          await new Promise(r => setTimeout(r, config.delayMs));
        }
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      setResults({
        status: 'completed',
        totalTransactions: totalSent,
        successCount,
        failureCount,
        avgConfirmTime: 0, // We are not tracking confirmation time per tx here for simplicity
        throughput: totalSent / duration,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      addLog('Stress test completed!');
      if (config.useHighPerformance) fetchBurnerBalance(burnerAddress);

    } catch (err: any) {
      setError(err.message || 'Stress test failed');
      addLog(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#00E5FF]/10 to-gray-900">
      <Navbar />

      <ProtectedRoute>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-warm-white mb-2">Stress Test Admin</h1>
            <p className="text-gray-400">
              Test Monad&apos;s parallel execution with concurrent transactions
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400">❌ {error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-warm-white mb-6">Test Configuration</h2>

                <div className="space-y-6">
                  {/* Mode Selection */}
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-lg font-bold text-warm-white">High Performance Mode</span>
                        <p className="text-sm text-gray-400">Uses burner wallet & eth_sendRawTransactionSync for max speed</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={config.useHighPerformance}
                          onChange={(e) => setConfig({ ...config, useHighPerformance: e.target.checked })}
                          disabled={isRunning}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${config.useHighPerformance ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.useHighPerformance ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                    </label>

                    {config.useHighPerformance && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-300">Burner Wallet:</span>
                          <span className="text-xs font-mono text-gray-400">{burnerAddress}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Balance:</span>
                          <span className={`text-sm font-bold ${parseFloat(burnerBalance) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {parseFloat(burnerBalance).toFixed(4)} MON
                          </span>
                        </div>
                        <button
                          onClick={fundBurnerWallet}
                          disabled={isRunning || !isConnected}
                          className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-warm-white rounded text-sm font-bold transition-colors"
                        >
                          ⛽ Fund Burner Wallet (0.1 MON)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Number of Transactions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Transactions: {config.numTransactions}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max={config.useHighPerformance ? 1000 : 100}
                      step="10"
                      value={config.numTransactions}
                      onChange={(e) => setConfig({ ...config, numTransactions: Number(e.target.value) })}
                      disabled={isRunning}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10</span>
                      <span>{config.useHighPerformance ? '1,000' : '100'}</span>
                    </div>
                  </div>

                  {/* Batch Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Batch Size: {config.batchSize}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={config.useHighPerformance ? 100 : 20}
                      step="1"
                      value={config.batchSize}
                      onChange={(e) => setConfig({ ...config, batchSize: Number(e.target.value) })}
                      disabled={isRunning}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      <span>{config.useHighPerformance ? '100' : '20'}</span>
                    </div>
                  </div>

                  {/* Delay Between Batches */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Delay Between Batches: {config.delayMs}ms
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="50"
                      value={config.delayMs}
                      onChange={(e) => setConfig({ ...config, delayMs: Number(e.target.value) })}
                      disabled={isRunning}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0ms</span>
                      <span>1000ms</span>
                    </div>
                  </div>

                  {/* Action Types (Visual only for now since we use updateProfile) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Action Types to Test (Simulated via Profile Updates)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(ACTION_TYPES).map(([key, value]) => (
                        <button
                          key={value}
                          onClick={() => handleActionToggle(value)}
                          disabled={isRunning}
                          className={`p-3 rounded-lg border-2 transition-all ${config.selectedActions.includes(value)
                            ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-warm-white'
                            : 'bg-gray-800 border-gray-700 text-gray-400'
                            } disabled:opacity-50`}
                        >
                          {ACTION_LABELS[value]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStartTest}
                    disabled={isRunning || !isConnected}
                    className={`w-full px-6 py-4 font-bold text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${config.useHighPerformance
                      ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-warm-white'
                      : 'bg-gradient-to-r from-[#00E5FF] to-[#1DE9B6] hover:from-[#00B8D4] hover:to-[#00BFA5] text-black'
                      }`}
                  >
                    {isRunning ? 'Sending Transactions...' : isConnected ? `Start ${config.useHighPerformance ? 'High Perf' : 'Normal'} Test` : 'Connect Wallet First'}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Panel */}
            <div className="space-y-6">
              {/* Progress */}
              {isRunning && (
                <div className="card">
                  <h3 className="text-xl font-bold text-warm-white mb-4">Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Submitting...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${config.useHighPerformance
                            ? 'bg-gradient-to-r from-green-500 to-teal-500'
                            : 'bg-gradient-to-r from-[#00E5FF] to-[#1DE9B6]'
                            }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-blue-500/20 rounded-lg">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                      <p className="text-sm text-blue-400">
                        {config.useHighPerformance ? 'Spamming network...' : 'Check MetaMask for popups...'}
                      </p>
                    </div>

                    {/* Logs */}
                    <div className="bg-black/30 p-2 rounded text-xs font-mono text-gray-400 h-24 overflow-hidden">
                      {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {results && (
                <div className="card">
                  <h3 className="text-xl font-bold text-warm-white mb-4">Results</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
                      <span className="text-sm text-gray-300">Sent</span>
                      <span className="text-lg font-bold text-green-400">{results.successCount}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-red-500/20 rounded-lg">
                      <span className="text-sm text-gray-300">Failed</span>
                      <span className="text-lg font-bold text-red-400">{results.failureCount}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                      <span className="text-sm text-gray-300">Throughput</span>
                      <span className="text-lg font-bold text-blue-400">{results.throughput.toFixed(1)} tx/s</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const data = JSON.stringify(results, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `stress-test-${Date.now()}.json`;
                      a.click();
                    }}
                    className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-warm-white rounded-lg transition-all"
                  >
                    📥 Download Results
                  </button>
                </div>
              )}

              {/* Info */}
              <div className="card bg-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">💡 About Stress Testing</h3>
                <ul className="text-xs text-gray-400 space-y-2">
                  <li>• Tests Monad&apos;s parallel execution capabilities</li>
                  <li>• <strong>Normal Mode:</strong> Uses MetaMask (slow, manual)</li>
                  <li>• <strong>High Perf Mode:</strong> Uses burner wallet & sync API (fast, auto)</li>
                  <li>• Requires Testnet MON for gas</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>

      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-black">
          <p>Built for Monad Testnet • Powered by Parallel EVM</p>
        </div>
      </footer>
    </div>
  );
}

// Helper for encodeFunctionData since we don't have viem's full type inference here easily
import { encodeFunctionData } from 'viem';
