'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { sapphireTestnet } from '../lib/chains';
import { useState } from 'react';

const rpcUrl = process.env.NEXT_PUBLIC_SAPPHIRE_RPC || sapphireTestnet.rpcUrls.default.http[0];

const wagmiConfig = createConfig({
  chains: [sapphireTestnet],
  transports: {
    [sapphireTestnet.id]: http(rpcUrl)
  },
  connectors: [injected({ target: 'metaMask' })],
  ssr: true
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
