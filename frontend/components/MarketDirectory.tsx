import { MarketCardData } from '../lib/types';
import MarketCard from './MarketCard';

type FilterKey = 'active' | 'locked' | 'resolved';

interface Props {
  markets: MarketCardData[];
  selectedId: number;
  onSelect: (market: MarketCardData) => void;
  filter?: FilterKey;
  filterLabels?: Record<FilterKey, string>;
  filterCounts?: Record<FilterKey, number>;
  onFilterChange?: (value: FilterKey) => void;
}

const filterConfig: { key: FilterKey; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'locked', label: 'Locked' },
  { key: 'resolved', label: 'Resolved' }
];

export default function MarketDirectory({
  markets,
  selectedId,
  onSelect,
  filter,
  filterLabels,
  filterCounts,
  onFilterChange
}: Props) {
  return (
    <section id="markets" className="card p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Market directory</p>
          <h3 className="text-xl font-semibold text-midnight">Explore active, locked, and resolved opportunities</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {filterConfig.map((item) => {
            const active = filter === item.key;
            const label = filterLabels?.[item.key] ?? item.label;
            const count = filterCounts?.[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilterChange?.(item.key)}
                className={`rounded-full border px-3 py-1 transition ${
                  active ? 'border-ocean bg-ocean/10 text-ocean' : 'border-slate-200 bg-white hover:border-ocean'
                }`}
              >
                {label}
                {typeof count === 'number' ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
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
      {markets.length === 0 && (
        <div className="mt-3 text-sm text-slate-600">No markets in this state yet. Try another filter.</div>
      )}
    </section>
  );
}
