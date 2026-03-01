import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import './index.css';
import { config } from './config';
import { AppBar } from './Appbar';
import { Dashboard } from './Dashboard';

function App() {
  const client = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <div className="min-h-screen w-full bg-[#0B0E11] text-[#EAECEF]">
          <AppBar />
          {/* Offset for fixed navbar */}
          <main className="pt-16">
            <div className="max-w-5xl mx-auto px-4 py-8">
              <Dashboard />
            </div>
          </main>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
