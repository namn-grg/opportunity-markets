import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import TradingWorkspace from '../../../../components/TradingWorkspace';
import marketsData from '../../../../data/markets.json';
import { MarketCardData } from '../../../../lib/types';

interface MarketPageProps {
  params: {
    marketId: string;
  };
}

export default function MarketDetailPage({ params }: MarketPageProps) {
  const marketId = Number(params.marketId);
  const markets = marketsData as MarketCardData[];
  const market = markets.find((entry) => entry.id === marketId);

  if (!market) {
    notFound();
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
      <TradingWorkspace market={market} />
    </main>
  );
}

