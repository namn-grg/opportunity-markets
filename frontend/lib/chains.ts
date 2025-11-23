import type { Chain } from 'viem';
import { sapphire as sapphireMainnet, sapphireTestnet as sapphireTestnetBase } from 'viem/chains';

const overrideRpcUrls = (chain: Chain, rpcUrl?: string): Chain => {
  if (!rpcUrl) return chain;
  return {
    ...chain,
  rpcUrls: {
      ...chain.rpcUrls,
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] }
    }
  };
};

const sapphireMainnetRpc = process.env.NEXT_PUBLIC_SAPPHIRE_MAINNET_RPC;
const sapphireTestnetRpc = process.env.NEXT_PUBLIC_SAPPHIRE_RPC;

export const sapphire = overrideRpcUrls(sapphireMainnet, sapphireMainnetRpc);
export const sapphireTestnet = overrideRpcUrls(
  sapphireTestnetBase,
  sapphireTestnetRpc || sapphireTestnetBase.rpcUrls.default.http[0]
);

export const supportedChains = [sapphireTestnet, sapphire];
