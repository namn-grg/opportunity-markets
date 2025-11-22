import { MarketCardData } from '../lib/types';
import { formatDate, formatPenalty, windowCopy } from '../lib/format';

interface Props {
  market: MarketCardData;
  isActive: boolean;
  onSelect: (market: MarketCardData) => void;
}

const stateCopy: Record<string, string> = {
  '0': 'Trading',
  '1': 'Locked',
  '2': 'Resolved YES',
  '3': 'Resolved NO'
};

export default function MarketCard({ market, isActive, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(market)}
      className={`card flex w-full flex-col gap-3 p-4 text-left transition ${
        isActive ? 'ring-2 ring-ocean' : 'hover:border-ocean'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-ocean">{stateCopy[market.state ?? '0'] || 'Trading'}</div>
        <div className="text-xs text-slate-500">{windowCopy(market.opportunityWindowEnd)}</div>
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Question</p>
        <h3 className="text-lg font-semibold text-midnight">{market.title}</h3>
        <p className="text-sm text-slate-600">{market.description}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1">Penalty {formatPenalty(market.penaltyBps)}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">Window ends {formatDate(market.opportunityWindowEnd)}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{market.options.length} options</span>
      </div>
    </button>
  );
}
