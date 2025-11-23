'use client';

import { PropsWithChildren } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { sapphireTestnet } from '../lib/chains';

const rainbowKitTheme = darkTheme({
  borderRadius: 'medium',
  accentColor: '#0f172a'
});

export function RainbowKitProviderWithAuth({ children }: PropsWithChildren) {
  return (
    <RainbowKitProvider modalSize="compact" initialChain={sapphireTestnet} theme={rainbowKitTheme}>
      {children}
    </RainbowKitProvider>
  );
}

