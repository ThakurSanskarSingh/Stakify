import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function AppBar() {
  const { address, isConnected } = useAccount();

  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900 text-white">
      <div className="text-2xl font-bold text-green-400">🌿 Sansu Staking</div>
      <div className="flex items-center gap-4">
        {isConnected && (
          <div className="text-sm text-green-400">
            ✅ Wallet Connected: {shortenAddress(address)}
          </div>
        )}
        {!address ? <Connectors /> : <Disconnect />}
      </div>
    </div>
  );
}

function Connectors() {
  const { connectors, connect, isPending } = useConnect();

  return connectors.map((connector) => (
    <button
      key={connector.uid}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
      onClick={() => connect({ connector })}
      disabled={isPending}
    >
      {connector.name}
    </button>
  ));
}

function Disconnect() {
  const { disconnect } = useDisconnect();

  return (
    <button
      className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm"
      onClick={() => disconnect()}
    >
      Disconnect
    </button>
  );
}

function shortenAddress(addr?: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
