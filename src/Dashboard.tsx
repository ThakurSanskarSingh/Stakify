import { useAccount, useReadContract,useChainId , useSwitchChain } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { TrendingUp, Award, ArrowDown, RefreshCw } from 'lucide-react';

import { stakingAbi } from './abi';
import { config } from './config';
import { sepolia } from 'wagmi/chains';

const STAKING_ADDRESS = import.meta.env.VITE_STAKING_ADDRESS;

export function Dashboard() {
  const { address, isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [stakedAmount, setStakedAmount] = useState(0n);
  const [pendingRewards, setPendingRewards] = useState(0n);
  const [totalStaked, setTotalStaked] = useState<bigint>(0n);

  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const currentChainId = useChainId();
  const isConnectedToSepolia = currentChainId === sepolia.id;

  const { data: userInfoData, refetch: refetchUserInfo } = useReadContract({
    address: STAKING_ADDRESS,
    abi: stakingAbi,
    functionName: 'userInfo',
    args: [address],
    query: {
      enabled: !!address && isConnected,
    },
  });

  
  const { data: totalStakedData } = useReadContract({
    address: STAKING_ADDRESS,
    abi: stakingAbi,
    functionName: 'totalStaked',
    query: {
      enabled: isConnected,
    },
  });
  const { data: liveRewards } = useReadContract({
    address: STAKING_ADDRESS,
    abi: stakingAbi,
    functionName: 'getRewards',
    args: [address],
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 3000, // every 3 sec
    },
  });
  


  const fetchData = async () => {
    if (isConnected && address) {
      console.log("Manually fetching data...");
      toast.loading('Refreshing data...', { id: 'refresh-data' });
      try {
        const userInfoResult = await refetchUserInfo();
        console.log("Refetched user info:", userInfoResult.data);
        
        if (userInfoResult.data) {
          const [staked] = userInfoResult.data as [bigint];
          console.log("Staked amount:", formatEther(staked));
          
          
          setStakedAmount(staked);
         
        }
        if (typeof liveRewards === 'bigint') {
          console.log("Live pending rewards:", formatEther(liveRewards));
          setPendingRewards(liveRewards);
        }
        
        toast.success('Data refreshed', { id: 'refresh-data' });
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error('Failed to refresh data', { id: 'refresh-data' });
      }
    }
  };


  useEffect(() => {
    if (isConnected && address) {
      if (userInfoData) {
        console.log("Direct userInfo result:", userInfoData);
        
        
        if (Array.isArray(userInfoData) && userInfoData.length > 1) {
          const staked = userInfoData[0];
          // const rewards = userInfoData[1];
          
          if (typeof staked === 'bigint') {
            setStakedAmount(staked);
            console.log("Updated staked amount:", formatEther(staked));
          }
          
         
        }
      }
      
      if (totalStakedData) {
        console.log("Total staked data:", totalStakedData);
        if (typeof totalStakedData === 'bigint') {
          setTotalStaked(totalStakedData);
          console.log("Updated total staked:", formatEther(totalStakedData));
        }
      }
    }
  }, [userInfoData, totalStakedData, isConnected, address]);

  useEffect(() => {
    if (isConnected && address && typeof liveRewards === 'bigint') {
      setPendingRewards(liveRewards);
      console.log("Updated live pending rewards:", formatEther(liveRewards));
    }
  }, [isConnected, address, liveRewards]);
  
  useEffect(() => {
    if (!isConnected || !address) return;
    
   
    fetchData();
    
   
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, [isConnected, address]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStake = async () => {
    if (!amount) {
      setError('Please enter an amount to stake');
      toast.error('Please enter an amount to stake');
      return;
    }
    
    if (!isConnected) {
      setError('Please connect your wallet');
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingAction('stake');
      setError('');
      setSuccessMessage('');

      const weiAmount = parseEther(amount);
      
      console.log("Staking", amount, "ETH");
      
      toast.loading(`Staking ${amount} ETH...`, { id: 'stake-tx' });
      
      const txHash = await writeContract(config, {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: 'stake',
        args: [weiAmount],
        value: weiAmount,
      });

      console.log('Transaction sent, hash:', txHash);

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        chainId: chainId as 1 | 11155111 | 31337,
      });

      console.log('Transaction confirmed, receipt:', receipt);
      setSuccessMessage(`Successfully staked ${amount} ETH`);
      toast.success(`Successfully staked ${amount} ETH`, { id: 'stake-tx' });
      setAmount('');
      
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      console.error('Staking error:', err);
      // Extract relevant error message
      const errorMessage = err.message?.includes('insufficient funds') 
        ? 'Insufficient ETH balance'
        : err.message?.includes('user rejected') 
          ? 'Transaction rejected'
          : 'Failed to stake ETH';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'stake-tx' });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleClaim = async () => {
    if (!isConnected) {
      setError('Please connect your wallet');
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingAction('claim');
      setError('');
      setSuccessMessage('');

      console.log("Claiming rewards");
      
      toast.loading(`Claiming rewards...`, { id: 'claim-tx' });
      
      const txHash = await writeContract(config, {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: 'claimEmissions',
      });

      console.log('Transaction sent, hash:', txHash);

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        chainId: chainId as 1 | 11155111 | 31337,
      });

      console.log('Transaction confirmed, receipt:', receipt);
      const rewardAmount = formatEther(pendingRewards).substring(0, 8);
      setSuccessMessage(`Successfully claimed ${rewardAmount} SANSU`);
      toast.success(`Successfully claimed ${rewardAmount} SANSU`, { id: 'claim-tx' });
      
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      console.error('Claim error:', err);
      // Extract relevant error message
      const errorMessage = err.message?.includes('user rejected') 
        ? 'Transaction rejected'
        : 'Failed to claim rewards';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'claim-tx' });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleUnstake = async () => {
    if (!isConnected) {
      setError('Please connect your wallet');
      toast.error('Please connect your wallet');
      return;
    }

    if (stakedAmount <= 0n) {
      setError('You have no ETH staked');
      toast.error('You have no ETH staked');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingAction('unstake');
      setError('');
      setSuccessMessage('');

      const amountToUnstake = formatEther(stakedAmount).substring(0, 8);
      console.log("Unstaking", amountToUnstake, "ETH");
      
      toast.loading(`Unstaking ${amountToUnstake} ETH...`, { id: 'unstake-tx' });
      
      const txHash = await writeContract(config, {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: 'unstake',
        args: [stakedAmount],
      });

      console.log('Transaction sent, hash:', txHash);

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        chainId: chainId as 1 | 11155111 | 31337,
      });

      console.log('Transaction confirmed, receipt:', receipt);
      setSuccessMessage(`Successfully unstaked ${amountToUnstake} ETH`);
      toast.success(`Successfully unstaked ${amountToUnstake} ETH`, { id: 'unstake-tx' });
      
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      console.error('Unstake error:', err);
      // Extract relevant error message
      const errorMessage = err.message?.includes('user rejected') 
        ? 'Transaction rejected'
        : 'Failed to unstake ETH';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'unstake-tx' });
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };


  const formatCrypto = (value: bigint) => {
    if (!value) return '0';
    return parseFloat(formatEther(value)).toFixed(6);
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Staking Dashboard</h1>
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-4 py-3 rounded mb-4">
          Please connect your wallet to continue.
        </div>
      </div>
    );
  }

  if (!isConnectedToSepolia) {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Staking Dashboard</h1>
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-4 py-3 rounded mb-4">
          <p className="mb-4">This dApp only works on Sepolia testnet.</p>
          <button 
            onClick={() => switchChain({ chainId: sepolia.id })} 
            disabled={isSwitchingChain}
            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isSwitchingChain ? 'Switching...' : 'Switch to Sepolia'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E1E1E',
            color: '#ffffff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#1E1E1E',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#1E1E1E',
            },
          },
        }}
      />

      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-500 to-amber-300 bg-clip-text text-transparent">
          SANSU Staking Platform
        </h1>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
         
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <TrendingUp className="mr-2 text-yellow-500" size={20} />
              Staking Overview
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="text-gray-400 text-sm mb-1">Total Staked</div>
                <div className="text-xl font-bold text-white">{formatCrypto(totalStaked)} ETH</div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="text-gray-400 text-sm mb-1">Current Rate</div>
                <div className="text-xl font-bold text-green-400">
  1 SANSU / sec per 1 ETH
</div>

              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="text-gray-400 text-sm mb-1">Your Stake</div>
                <div className="text-xl font-bold text-white">{formatCrypto(stakedAmount)} ETH</div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="text-gray-400 text-sm mb-1">Your Rewards</div>
                <div className="text-xl font-bold text-yellow-400">{formatCrypto(pendingRewards)} SANSU</div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
              <button 
                onClick={fetchData}
                className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <RefreshCw size={14} className="mr-1" /> Refresh Data
              </button>
            </div>
          </div>

          {/* Staking Form */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Stake ETH</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <button 
                  className="absolute right-2 top-2 bg-gray-600 text-xs px-2 py-1 rounded text-white hover:bg-gray-500"
                  onClick={() => {
                   
                    setAmount('1');
                  }}
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleStake}
                disabled={isLoading || !amount}
                className={`w-full p-3 rounded-lg font-medium flex items-center justify-center ${
                  isLoading && loadingAction === 'stake' 
                    ? 'bg-yellow-800 text-yellow-300' 
                    : 'bg-yellow-600 text-white hover:bg-yellow-500'
                } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {isLoading && loadingAction === 'stake' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Stake ETH'
                )}
              </button>
              <button
                onClick={handleClaim}
                disabled={isLoading || pendingRewards <= 0n}
                className={`w-full p-3 rounded-lg font-medium flex items-center justify-center ${
                  isLoading && loadingAction === 'claim' 
                    ? 'bg-blue-800 text-blue-300' 
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {isLoading && loadingAction === 'claim' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Award className="mr-2" size={16} />
                    Claim Rewards
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleUnstake}
                disabled={isLoading || stakedAmount <= 0n}
                className={`w-full p-3 rounded-lg font-medium flex items-center justify-center ${
                  isLoading && loadingAction === 'unstake' 
                    ? 'bg-red-800 text-red-300' 
                    : 'bg-red-600 text-white hover:bg-red-500'
                } focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {isLoading && loadingAction === 'unstake' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDown className="mr-2" size={16} />
                    Unstake All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Award className="mr-2 text-yellow-500" size={20} />
            Rewards Program
          </h2>
          
          <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-700/50 rounded-lg p-4 mb-4">
            <p className="text-amber-200">
              Stake your ETH and earn SANSU tokens as rewards. The longer you stake, the more you earn!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="text-gray-300 text-sm mb-1">Rewards Rate</div>
              <div className="text-xl font-bold text-green-400">
  1 SANSU / sec per 1 ETH
</div>

            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="text-gray-300 text-sm mb-1">Distribution</div>
              <div className="text-lg font-bold text-white">Continuous</div>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="text-gray-300 text-sm mb-1">Lock Period</div>
              <div className="text-lg font-bold text-white">None</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}