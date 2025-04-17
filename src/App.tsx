import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import './App.css';
import { config } from './config';
import { AppBar } from './Appbar';
import { Dashboard } from './Dashboard';

function App() {
  const client = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col">
          <AppBar />

          <main className="flex-1 flex justify-center items-start p-6">
            <Dashboard />
          </main>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
