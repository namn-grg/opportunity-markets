'use client';

import { useMemo, useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import MarketDirectory from '../components/MarketDirectory';
import TradingWorkspace from '../components/TradingWorkspace';
import SponsorWizard from '../components/SponsorWizard';
import marketsData from '../data/markets.json';
import { MarketCardData } from '../lib/types';

export default function HomePage() {
  const markets = useMemo(() => marketsData as MarketCardData[], []);
  const [selectedMarket, setSelectedMarket] = useState(markets[0]);

  return (
    <main className="space-y-8">
      <Header />
      <Hero />
      <MarketDirectory markets={markets} selectedId={selectedMarket.id} onSelect={setSelectedMarket} />
      <TradingWorkspace market={selectedMarket} />
      <SponsorWizard />
      <section className="card p-6 text-sm text-slate-700">
        <h4 className="text-lg font-semibold text-midnight">Policy drawer</h4>
        <p className="mt-2 text-slate-600">
          We mirror the opportunity-markets article: dark pricing, delayed fills, and reputational guardrails. Penalty basis
          points discourage frivolous NO outcomes; sponsors cannot trade their own markets. Storage confidentiality lives on Oasis
          Sapphire, so the UI avoids surfacing reserve data and nudges users to think in windows instead of ticks.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Opportunity window defaults to ~two weeks; countdowns are front-and-center.</li>
          <li>Trade forms require slippage bounds (maxPrice) and min YES out to avoid price surprises.</li>
          <li>Resolution CTAs live in the sponsor console and warn before irreversible steps.</li>
          <li>Portfolio ideas: claim reminders and CSV export can slot into this layout post-hackathon.</li>
        </ul>
      </section>
    </main>
  );
}
