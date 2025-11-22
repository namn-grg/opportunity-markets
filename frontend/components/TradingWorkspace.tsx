import { formatDate, formatPenalty, windowCopy } from '../lib/format';
import { MarketMetadata } from '../lib/types';
import TradeForm from './TradeForm';

interface Props {
  market: MarketMetadata;
}

export default function TradingWorkspace({ market }: Props) {
  return (
    <section className="mb-8 grid gap-6 lg:grid-cols-5">
      <div className="card lg:col-span-2">
        <div className="border-b border-slate-100 p-5">
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Overview</p>
          <h3 className="text-xl font-semibold text-midnight">{market.title}</h3>
          <p className="text-sm text-slate-600">{market.description}</p>
        </div>
        <div className="space-y-4 p-5 text-sm text-slate-700">
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="font-semibold text-midnight">Opportunity window</p>
            <p className="text-slate-600">
              {windowCopy(market.opportunityWindowEnd)} • closes {formatDate(market.opportunityWindowEnd)}
            </p>
            <p className="text-xs text-slate-500">
              Trades are allowed while the window is open. Once closed, the market auto-locks and awaits sponsor review per the
              article’s guidance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">Sponsor {market.sponsor}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Collateral {market.collateralSymbol}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">{formatPenalty(market.penaltyBps)}</span>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="font-semibold text-midnight">Options</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
              {market.options.map((opt) => (
                <li key={opt.optionHash}>
                  {opt.label} <span className="text-xs text-slate-500">({opt.optionHash.slice(0, 10)}...)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="lg:col-span-3">
        <TradeForm market={market} />
      </div>
    </section>
  );
}
