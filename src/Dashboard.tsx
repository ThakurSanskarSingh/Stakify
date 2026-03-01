import { useAccount, useReadContract, useChainId, useSwitchChain } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { TrendingUp, Award, ArrowDown, RefreshCw, Zap, Clock, Unlock } from 'lucide-react';

import { stakingAbi } from './abi';
import { config } from './config';
import { sepolia } from 'wagmi/chains';

const STAKING_ADDRESS = import.meta.env.VITE_STAKING_ADDRESS;

// ─── Shared sub-components ────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  accent?: boolean;
}

function StatCard({ label, value, unit, icon, accent }: StatCardProps) {
  return (
    <div className="bg-[#1E2026] border border-[#2E3340] rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[#848E9C] text-sm font-medium">{label}</span>
        <span className={`p-1.5 rounded-md ${accent ? 'bg-[#F0B90B]/10 text-[#F0B90B]' : 'bg-[#2B2F36] text-[#848E9C]'}`}>
          {icon}
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-semibold text-[#EAECEF] tabular-nums leading-none">{value}</span>
        {unit && <span className="text-[#848E9C] text-sm pb-0.5">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { address, isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [stakedAmount, setStakedAmount] = useState(0n);
  const [pendingRewards, setPendingRewards] = useState(0n);

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

  const fetchData = async () => {
    if (isConnected && address) {
      toast.loading('Refreshing data...', { id: 'refresh-data' });
      try {
        const userInfoResult = await refetchUserInfo();
        if (userInfoResult.data) {
          const [staked, rewards] = userInfoResult.data as [bigint, bigint];
          setStakedAmount(staked);
          setPendingRewards(rewards);
        }
        toast.success('Data refreshed', { id: 'refresh-data' });
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to refresh data', { id: 'refresh-data' });
      }
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      if (userInfoData) {
        if (Array.isArray(userInfoData) && userInfoData.length > 1) {
          const staked = userInfoData[0];
          const rewards = userInfoData[1];
          if (typeof staked === 'bigint') setStakedAmount(staked);
          if (typeof rewards === 'bigint') setPendingRewards(rewards);
        }
      }
    }
  }, [userInfoData, isConnected, address]);

  useEffect(() => {
    if (!isConnected || !address) return;
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [isConnected, address]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
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
      toast.loading(`Staking ${amount} ETH...`, { id: 'stake-tx' });
      const txHash = await writeContract(config, {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: 'stake',
        args: [weiAmount],
        value: weiAmount,
      });
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
      toast.loading(`Claiming rewards...`, { id: 'claim-tx' });
      const txHash = await writeContract(config, {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: 'claimEmissions',
      });
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
      toast.loading(`Unstaking ${amountToUnstake} ETH...`, { id: 'unstake-tx' });
      const txHash = await writeContract(config, {
        address: STAKING_ADDRESS,
        abi: stakingAbi,
        functionName: 'unstake',
        args: [stakedAmount],
      });
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        chainId: chainId as 1 | 11155111 | 31337,
      });
      console.log('Transaction confirmed, receipt:', receipt);
      setSuccessMessage(`Successfully unstaked ${amountToUnstake} ETH`);
      toast.success(`Successfully unstaked ${amountToUnstake} ETH`, { id: 'unstake-tx' });
      setTimeout(fetchData, 2000);
    } catch (err: any) {
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
    if (!value) return '0.000000';
    return parseFloat(formatEther(value)).toFixed(6);
  };

  // ── Not connected state ───────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <div className="text-[#F0B90B] text-5xl mb-4">⬡</div>
          <h1 className="text-2xl font-bold text-[#EAECEF] mb-2">SANSU Staking Platform</h1>
          <p className="text-[#848E9C] text-sm">Connect your wallet to start staking ETH and earning SANSU rewards.</p>
        </div>
        <div className="bg-[#1E2026] border border-[#F0B90B]/30 rounded-lg px-5 py-4 max-w-sm w-full text-center">
          <div className="w-2 h-2 rounded-full bg-[#F0B90B] mx-auto mb-3 animate-pulse"></div>
          <p className="text-[#EAECEF] text-sm font-medium">Wallet not connected</p>
          <p className="text-[#848E9C] text-xs mt-1">Use the Connect button in the top-right corner</p>
        </div>
      </div>
    );
  }

  // ── Wrong network state ───────────────────────────────────────────────────
  if (!isConnectedToSepolia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <div className="text-[#F6465D] text-5xl mb-4">⚠</div>
          <h1 className="text-2xl font-bold text-[#EAECEF] mb-2">Wrong Network</h1>
          <p className="text-[#848E9C] text-sm">This dApp only works on the Sepolia testnet.</p>
        </div>
        <div className="bg-[#1E2026] border border-[#F6465D]/30 rounded-lg px-5 py-5 max-w-sm w-full text-center">
          <p className="text-[#EAECEF] text-sm font-medium mb-4">Please switch your network to continue</p>
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isSwitchingChain}
            className="w-full bg-[#F0B90B] text-[#0B0E11] font-semibold text-sm px-4 py-2.5 rounded-md hover:bg-[#D4A009] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSwitchingChain ? (
              <>
                <Spinner /> Switching...
              </>
            ) : (
              'Switch to Sepolia'
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E2026',
            color: '#EAECEF',
            border: '1px solid #2E3340',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#0ECB81', secondary: '#1E2026' },
          },
          error: {
            iconTheme: { primary: '#F6465D', secondary: '#1E2026' },
          },
        }}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EAECEF]">Staking Dashboard</h1>
          <p className="text-[#848E9C] text-sm mt-0.5">
            Stake ETH · Earn SANSU
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-sm text-[#848E9C] hover:text-[#EAECEF] bg-[#1E2026] border border-[#2E3340] px-3 py-2 rounded-md hover:bg-[#2B2F36] transition-colors duration-150"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div className="bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-[#0ECB81]/10 border border-[#0ECB81]/30 text-[#0ECB81] px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Reward Rate"
          value="1 SANSU"
          unit="/ sec · ETH"
          icon={<TrendingUp size={16} />}
          accent
        />
        <StatCard
          label="Your Staked ETH"
          value={formatCrypto(stakedAmount)}
          unit="ETH"
          icon={<Zap size={16} />}
          accent={stakedAmount > 0n}
        />
        <StatCard
          label="Claimable Rewards"
          value={formatCrypto(pendingRewards)}
          unit="SANSU"
          icon={<Award size={16} />}
          accent={pendingRewards > 0n}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left — Stake ETH */}
        <div className="bg-[#1E2026] border border-[#2E3340] rounded-lg p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#EAECEF]">Stake ETH</h2>
            <span className="text-xs text-[#848E9C] bg-[#2B2F36] border border-[#2E3340] px-2 py-0.5 rounded">
              Sepolia
            </span>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#848E9C]">Amount</label>
            <div className="relative">
              <input
                type="number"
                className="w-full bg-[#2B2F36] border border-[#2E3340] text-[#EAECEF] text-sm px-3 py-2.5 pr-20 rounded-md placeholder:text-[#474D57] focus:outline-none focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-colors duration-150"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  className="text-xs font-semibold text-[#F0B90B] bg-[#F0B90B]/10 hover:bg-[#F0B90B]/20 px-2 py-1 rounded transition-colors duration-150"
                  onClick={() => setAmount('1')}
                >
                  MAX
                </button>
                <span className="text-[#848E9C] text-xs font-medium pr-1">ETH</span>
              </div>
            </div>
            <p className="text-xs text-[#474D57]">Minimum stake: 0.001 ETH · Gas fees apply</p>
          </div>

          <button
            onClick={handleStake}
            disabled={isLoading || !amount}
            className="w-full bg-[#F0B90B] text-[#0B0E11] font-semibold text-sm px-4 py-2.5 rounded-md hover:bg-[#D4A009] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && loadingAction === 'stake' ? (
              <><Spinner /> Processing...</>
            ) : (
              <><TrendingUp size={15} /> Stake ETH</>
            )}
          </button>

          {/* Wallet address row */}
          <div className="flex items-center justify-between pt-1 border-t border-[#2E3340]">
            <span className="text-xs text-[#474D57]">Connected wallet</span>
            <span className="text-xs text-[#848E9C] font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="bg-[#1E2026] border border-[#2E3340] rounded-lg p-6 flex flex-col gap-5">
          <h2 className="text-base font-semibold text-[#EAECEF]">Actions</h2>

          {/* Claim Rewards */}
          <div className="bg-[#2B2F36] border border-[#2E3340] rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#EAECEF]">Claim Rewards</p>
                <p className="text-xs text-[#848E9C] mt-0.5">Claimable now</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-[#F0B90B] tabular-nums">{formatCrypto(pendingRewards)}</p>
                <p className="text-xs text-[#848E9C]">SANSU</p>
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={isLoading || pendingRewards <= 0n}
              className="w-full bg-[#F0B90B] text-[#0B0E11] font-semibold text-sm px-4 py-2.5 rounded-md hover:bg-[#D4A009] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && loadingAction === 'claim' ? (
                <><Spinner /> Processing...</>
              ) : (
                <><Award size={15} /> Claim SANSU</>
              )}
            </button>
          </div>

          {/* Unstake */}
          <div className="bg-[#2B2F36] border border-[#2E3340] rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#EAECEF]">Unstake All</p>
                <p className="text-xs text-[#848E9C] mt-0.5">Withdraws entire position</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-[#EAECEF] tabular-nums">{formatCrypto(stakedAmount)}</p>
                <p className="text-xs text-[#848E9C]">ETH staked</p>
              </div>
            </div>
            <button
              onClick={handleUnstake}
              disabled={isLoading || stakedAmount <= 0n}
              className="w-full bg-[#2B2F36] text-[#F6465D] border border-[#F6465D]/40 font-semibold text-sm px-4 py-2.5 rounded-md hover:bg-[#F6465D]/10 hover:border-[#F6465D] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && loadingAction === 'unstake' ? (
                <><Spinner /> Processing...</>
              ) : (
                <><ArrowDown size={15} /> Unstake All ETH</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rewards Program Info */}
      <div className="bg-[#1E2026] border border-[#2E3340] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award size={16} className="text-[#F0B90B]" />
          <h2 className="text-base font-semibold text-[#EAECEF]">Rewards Program</h2>
        </div>

        <div className="bg-[#F0B90B]/5 border border-[#F0B90B]/20 rounded-lg px-4 py-3 mb-5">
          <p className="text-[#848E9C] text-sm leading-relaxed">
            Stake your ETH and earn <span className="text-[#F0B90B] font-medium">SANSU tokens</span> continuously. Rewards accrue every second — the longer you stake, the more you earn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#2B2F36] border border-[#2E3340] rounded-lg p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#848E9C]">
              <TrendingUp size={13} />
              <span className="text-xs font-medium uppercase tracking-wide">Reward Rate</span>
            </div>
            <span className="text-[#0ECB81] font-semibold text-sm tabular-nums">1 SANSU / sec / ETH</span>
          </div>
          <div className="bg-[#2B2F36] border border-[#2E3340] rounded-lg p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#848E9C]">
              <Clock size={13} />
              <span className="text-xs font-medium uppercase tracking-wide">Distribution</span>
            </div>
            <span className="text-[#EAECEF] font-semibold text-sm">Continuous</span>
          </div>
          <div className="bg-[#2B2F36] border border-[#2E3340] rounded-lg p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#848E9C]">
              <Unlock size={13} />
              <span className="text-xs font-medium uppercase tracking-wide">Lock Period</span>
            </div>
            <span className="text-[#EAECEF] font-semibold text-sm">None</span>
          </div>
        </div>
      </div>
    </div>
  );
}