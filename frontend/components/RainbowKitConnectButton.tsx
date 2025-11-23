'use client';

import type { ReactNode } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

type ConnectButtonRenderProps = Parameters<React.ComponentProps<typeof ConnectButton.Custom>['children']>[0];

interface Props {
  children?: (props: ConnectButtonRenderProps) => ReactNode;
}

export function RainbowKitConnectButton({ children }: Props) {
  if (children) {
    return <ConnectButton.Custom>{props => <>{children(props)}</>}</ConnectButton.Custom>;
  }

  return <ConnectButton />;
}

