'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { sapphireTestnet } from '../lib/chains';

const rpcUrl = process.env.NEXT_PUBLIC_SAPPHIRE_RPC || sapphireTestnet.rpcUrls.default.http[0];

const queryClient = new QueryClient();

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sapphireTestnet],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: rpcUrl
      })
    })
  ]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: { shimDisconnect: true }
    })
  ],
  publicClient,
  webSocketPublicClient,
  queryClient
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
    </QueryClientProvider>
  );
}
