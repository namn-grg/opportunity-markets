'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MarketDirectory from '../../components/MarketDirectory';
import Navbar from '../../components/Navbar';
import TradingWorkspace from '../../components/TradingWorkspace';
import marketsData from '../../data/markets.json';
import { MarketCardData } from '../../lib/types';

type FilterKey = 'active' | 'locked' | 'resolved';

const filterLabels: Record<FilterKey, string> = {
  active: 'Active',
  locked: 'Locked',
  resolved: 'Resolved'
};

export default function AppPage() {
  const markets = useMemo(() => marketsData as MarketCardData[], []);
  const [filter, setFilter] = useState<FilterKey>('active');
  const [selectedMarket, setSelectedMarket] = useState<MarketCardData | null>(null);

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

  useEffect(() => {
    if (!selectedMarket) {
      setSelectedMarket(filteredMarkets[0] ?? markets[0]);
      return;
    }

    if (filteredMarkets.length && !filteredMarkets.some((market) => market.id === selectedMarket.id)) {
      setSelectedMarket(filteredMarkets[0]);
    }
  }, [filteredMarkets, markets, selectedMarket]);

  return (
    <main className="space-y-8 pb-14">
      <Navbar />

      <section id="markets" className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-2 space-y-4">
          <MarketDirectory
            markets={filteredMarkets}
            selectedId={selectedMarket?.id ?? -1}
            onSelect={setSelectedMarket}
            filter={filter}
            onFilterChange={setFilter}
            filterCounts={filterCounts}
            filterLabels={filterLabels}
          />
        </div>
        <div className="lg:col-span-3">
          {selectedMarket ? (
            <TradingWorkspace market={selectedMarket} />
          ) : (
            <div className="card p-6 text-slate-600">Select a market to load the trading workspace.</div>
          )}
        </div>
      </section>
    </main>
  );
}
