import { defineChain } from 'viem';

const defaultRpcUrl = process.env.NEXT_PUBLIC_SAPPHIRE_RPC || 'https://testnet.sapphire.oasis.dev';

export const sapphireTestnet = defineChain({
  id: 0x5afe,
  name: 'Oasis Sapphire Testnet',
  network: 'sapphire-testnet',
  nativeCurrency: { name: 'Sapphire ROSE', symbol: 'ROSE', decimals: 18 },
  rpcUrls: {
    default: { http: [defaultRpcUrl] },
    public: { http: [defaultRpcUrl] }
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://testnet.explorer.sapphire.oasis.dev' }
  }
});
