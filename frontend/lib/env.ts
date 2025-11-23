export const getWalletConnectProjectId = (): string => {
  const id = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? process.env.VITE_WALLET_CONNECT_PROJECT_ID;
  if (!id) {
    throw new Error('Missing WalletConnect project id. Set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID or VITE_WALLET_CONNECT_PROJECT_ID');
  }
  return id;
};

