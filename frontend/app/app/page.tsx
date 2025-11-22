'use client';

import { useMemo, useState } from 'react';
import MarketDirectory from '../../components/MarketDirectory';
import Navbar from '../../components/Navbar';
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
