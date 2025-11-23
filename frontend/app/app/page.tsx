'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import MarketDirectory from '../../components/MarketDirectory';
import Navbar from '../../components/Navbar';
import { demoModeEnabled, listDemoMarkets } from '../../lib/demoState';
import { opportunityFactoryAbi, opportunityMarketAbi } from '../../lib/contracts';
import { MarketCardData } from '../../lib/types';

type FilterKey = 'active' | 'locked' | 'resolved';

const filterLabels: Record<FilterKey, string> = {
  active: 'Active',
  locked: 'Locked',
  resolved: 'Resolved'
};

export default function AppPage() {
  const publicClient = usePublicClient();
  const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined;
  const [markets, setMarkets] = useState<MarketCardData[]>([]);
  const [, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (demoModeEnabled || !factoryAddress || !publicClient) {
      const syncDemo = () => {
        if (!cancelled) setMarkets(listDemoMarkets());
      };
      syncDemo();
      window.addEventListener('storage', syncDemo);
      return () => {
        cancelled = true;
        window.removeEventListener('storage', syncDemo);
      };
    }

    const load = async () => {
      setLoading(true);
      try {
        const length = await publicClient.readContract({
          address: factoryAddress,
          abi: opportunityFactoryAbi,
          functionName: 'marketsLength'
        });
        const total = Number(length);
        const fetched: MarketCardData[] = [];
        for (let i = 0; i < total; i++) {
          const cfg = await publicClient.readContract({
            address: factoryAddress,
            abi: opportunityFactoryAbi,
            functionName: 'getMarket',
            args: [BigInt(i)]
          });
          const state = await publicClient.readContract({
            address: cfg.market as `0x${string}`,
            abi: opportunityMarketAbi,
            functionName: 'state'
          });
          const optionCount = Number(cfg.optionCount);
          fetched.push({
            id: i,
            marketAddress: cfg.market as `0x${string}`,
            questionHash: cfg.questionHash as `0x${string}`,
            title: `On-chain market #${i}`,
            description: 'Fetched from factory; question hashed for privacy.',
            opportunityWindowEnd: new Date(Number(cfg.opportunityWindowEnd) * 1000).toISOString(),
            penaltyBps: Number(cfg.penaltyBps),
            sponsor: cfg.sponsor as `0x${string}`,
            collateralSymbol: 'USDC',
            collateralAddress: cfg.collateralToken as `0x${string}`,
            options: Array.from({ length: optionCount }, (_, idx) => ({
              label: `Option ${idx + 1}`,
              optionHash: `0x${(idx + 1).toString(16).padStart(64, '0')}` as `0x${string}`
            })),
            state: String(state),
            totalOptions: optionCount
          });
        }
        if (!cancelled) setMarkets(fetched);
      } catch (error) {
        if (!cancelled) setMarkets(listDemoMarkets());
        console.error('Failed to load markets', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [factoryAddress, publicClient]);

  const [filter, setFilter] = useState<FilterKey>('active');

  const filteredMarkets = useMemo(() => {
    return markets.filter((market) => {
      const state = market.state ?? '0';
      if (filter === 'active') return state === '0' || state === undefined;
      if (filter === 'locked') return state === '1';
      return state === '2' || state === '3';
    });
  }, [filter, markets]);

  const filterCounts = useMemo(
    () => ({
      active: markets.filter((m) => (m.state ?? '0') === '0').length,
      locked: markets.filter((m) => m.state === '1').length,
      resolved: markets.filter((m) => m.state === '2' || m.state === '3').length
    }),
    [markets]
  );

  return (
    <main className="space-y-8 pb-14">
      <Navbar />

      <MarketDirectory
        markets={filteredMarkets}
        filter={filter}
        onFilterChange={setFilter}
        filterCounts={filterCounts}
        filterLabels={filterLabels}
      />
    </main>
  );
}
