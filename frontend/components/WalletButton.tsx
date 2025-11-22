'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMemo } from 'react';

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const primaryConnector = useMemo(() => connectors[0], [connectors]);

  if (isConnected) {
    return (
      <button className="btn-secondary" onClick={() => disconnect()}>
        {address?.slice(0, 6)}...{address?.slice(-4)} • Disconnect
      </button>
    );
  }

  return (
    <button
      className="btn-primary"
      onClick={() => primaryConnector && connect({ connector: primaryConnector })}
      disabled={isPending}
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
