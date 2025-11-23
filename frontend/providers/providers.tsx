'use client';

import '@rainbow-me/rainbowkit/styles.css';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { supportedChains } from '../lib/chains';
import { getWalletConnectProjectId } from '../lib/env';
import { RainbowKitProviderWithAuth } from '../components/RainbowKitProviderWithAuth';

const transports = supportedChains.reduce<Record<number, ReturnType<typeof http>>>((map, chain) => {
  map[chain.id] = http(chain.rpcUrls.default.http[0]);
  return map;
}, {});

const wagmiConfig = getDefaultConfig({
  appName: 'Opportunity Markets',
  projectId: getWalletConnectProjectId(),
  chains: supportedChains,
  transports,
  ssr: true
});

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProviderWithAuth>{children}</RainbowKitProviderWithAuth>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
