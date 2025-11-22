import { MarketCardData } from '../lib/types';
import MarketCard from './MarketCard';

interface Props {
  markets: MarketCardData[];
  selectedId: number;
  onSelect: (market: MarketCardData) => void;
}

export default function MarketDirectory({ markets, selectedId, onSelect }: Props) {
  return (
    <section className="card mb-8 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Market directory</p>
          <h3 className="text-xl font-semibold text-midnight">Explore active, locked, and resolved opportunities</h3>
        </div>
        <div className="text-xs text-slate-600">Tap a card to load the trading workspace</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {markets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            isActive={market.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
