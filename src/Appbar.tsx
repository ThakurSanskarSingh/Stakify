import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function AppBar() {
  const { address } = useAccount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0B0E11] border-b border-[#2E3340] flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-[#F0B90B] text-xl">⬡</span>
        <span className="text-[#EAECEF] font-bold text-lg tracking-tight">
          Stakify
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#2B2F36] border border-[#2E3340] text-[#848E9C] text-xs font-medium px-2.5 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] inline-block"></span>
          Sepolia Testnet
        </span>

          {!address ? <Connectors /> : <WalletDisplay address={address} />}
      </div>
    </header>
  );
}

function Connectors() {
  const { connectors, connect, isPending } = useConnect();

  return (
    <div className="flex items-center gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          className="bg-[#F0B90B] text-[#0B0E11] font-semibold text-sm px-4 py-2 rounded-md hover:bg-[#D4A009] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {isPending ? 'Connecting...' : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}

function WalletDisplay({ address }: { address: string }) {
  const { disconnect } = useDisconnect();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-[#2B2F36] border border-[#2E3340] text-[#EAECEF] text-sm font-medium px-3 py-2 rounded-md">
        <span className="w-2 h-2 rounded-full bg-[#0ECB81] inline-block"></span>
        <span className="font-mono text-xs">{shortenAddress(address)}</span>
      </div>
      <button
        className="bg-[#2B2F36] border border-[#2E3340] text-[#848E9C] text-sm px-3 py-2 rounded-md hover:bg-[#363B44] hover:text-[#EAECEF] transition-colors duration-150"
        onClick={() => disconnect()}
      >
        Disconnect
      </button>
    </div>
  );
}

function shortenAddress(addr?: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
