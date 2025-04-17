// config.ts
import { createConfig, http, injected } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

const hardhat = {
  id: 31337,
  name: 'Hardhat',
  network: 'localhost',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
};

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});
