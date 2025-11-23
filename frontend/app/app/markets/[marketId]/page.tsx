'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '../../../../components/Navbar';
import TradingWorkspace from '../../../../components/TradingWorkspace';
import marketsData from '../../../../data/markets.json';
import { getDemoMarket } from '../../../../lib/demoState';
import { DemoMarket, MarketCardData } from '../../../../lib/types';

interface MarketPageProps {
  params: {
    marketId: string;
  };
}

export default function MarketDetailPage({ params }: MarketPageProps) {
  const marketId = Number(params.marketId);
  const [market, setMarket] = useState<DemoMarket | null>(null);

  useEffect(() => {
    const stored = getDemoMarket(marketId);
    if (stored) {
      setMarket(stored);
      return;
    }
    const fallback = (marketsData as MarketCardData[]).find((entry) => entry.id === marketId);
    if (fallback) {
      setMarket({
        ...fallback,
        state: fallback.state ?? '0',
        bids: [],
        lockedAt: null,
        winningOptionId: null,
        sponsorPayout: null
      });
    }
  }, [marketId]);

  if (!market) {
    return (
      <main className="space-y-8 pb-14">
        <Navbar />
        <section className="card space-y-3 p-6">
          <Link href="/app#markets" className="text-sm text-ocean hover:underline">
            ← Back to markets
          </Link>
          <p className="text-sm text-slate-600">We could not find that market. Please reload and try again.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-14">
      <Navbar />
      <section className="card space-y-3 p-6">
        <Link href="/app#markets" className="text-sm text-ocean hover:underline">
          ← Back to markets
        </Link>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Market detail</p>
          <h1 className="text-3xl font-semibold text-midnight">{market.title}</h1>
          <p className="text-sm text-slate-600">{market.description}</p>
        </div>
      </section>
      <TradingWorkspace market={market} onMarketUpdate={setMarket} />
    </main>
  );
}
