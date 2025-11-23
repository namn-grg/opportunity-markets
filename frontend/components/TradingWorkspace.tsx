'use client';

import { useMemo, useState } from 'react';
import { formatDate, formatPenalty, windowCopy } from '../lib/format';
import {
  claimDemoYes,
  claimSponsorPayout,
  demoModeEnabled,
  lockDemoMarket,
  resolveDemoMarket
} from '../lib/demoState';
import { DemoMarket } from '../lib/types';
import TradeForm from './TradeForm';

interface Props {
  market: DemoMarket;
  onMarketUpdate?: (market: DemoMarket) => void;
}

const StatusPill = ({ label, tone }: { label: string; tone: 'green' | 'slate' | 'orange' }) => {
  const toneClass =
    tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'orange' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100';
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>{label}</span>;
};

function DemoOrderBook({ market, onMarketUpdate }: Props) {
  const [panelStatus, setPanelStatus] = useState('');
  const [winningOption, setWinningOption] = useState(market.winningOptionId ?? 0);

  const totals = useMemo(() => {
    const collateral = market.bids.reduce((sum, bid) => sum + bid.collateralIn, 0);
    const yesOut = market.bids.reduce((sum, bid) => sum + bid.yesOut, 0);
    return { collateral, yesOut };
  }, [market.bids]);

  const handleLock = () => {
    const updated = lockDemoMarket(market.id);
    if (updated) {
      onMarketUpdate?.(updated);
      setPanelStatus('Window locked; bids are now view-only.');
    }
  };

  const handleResolve = () => {
    const updated = resolveDemoMarket(market.id, winningOption);
    if (updated) {
      onMarketUpdate?.(updated);
      setPanelStatus(`Resolved with "${updated.options[winningOption]?.label ?? 'selected option'}" winning.`);
    }
  };

  const handleTraderPayout = () => {
    const { market: updated, amount } = claimDemoYes(market.id);
    if (updated) onMarketUpdate?.(updated);
    setPanelStatus(`Trader payouts released. ${amount.toFixed(2)} YES sent to winners.`);
  };

  const handleSponsorPayout = () => {
    const { market: updated, amount } = claimSponsorPayout(market.id);
    if (updated) onMarketUpdate?.(updated);
    setPanelStatus(`Sponsor payout claimed (${amount.toFixed(2)} from penalties).`);
  };

  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Order book</p>
          <h4 className="text-lg font-semibold text-midnight">Sponsor & scout view</h4>
        </div>
        <StatusPill label={market.state === '2' ? 'Resolved' : market.state === '1' ? 'Locked' : 'Trading'} tone="slate" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-midnight">Book totals</p>
          <p>{market.bids.length} bids • {totals.collateral.toFixed(2)} {market.collateralSymbol} posted</p>
          <p className="text-xs text-slate-500">{totals.yesOut.toFixed(2)} YES minted across options</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-midnight">Resolution</p>
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
            <select
              value={winningOption}
              onChange={(e) => setWinningOption(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              {market.options.map((opt, idx) => (
                <option key={opt.optionHash} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn-secondary whitespace-nowrap" onClick={handleResolve}>
              Resolve
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Winner: {market.winningOptionId !== null && market.winningOptionId !== undefined
              ? market.options[market.winningOptionId]?.label ?? 'Selected'
              : 'Not resolved yet'}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-midnight">Payouts</p>
          <p>Trader claims: winners mint {market.bids.filter((b) => b.status === 'won').length} receipts</p>
          <p>Sponsor payout: {(market.sponsorPayout ?? 0).toFixed(2)} {market.collateralSymbol}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <button type="button" className="btn-secondary" onClick={handleTraderPayout}>
              Release trader funds
            </button>
            <button type="button" className="btn-secondary" onClick={handleSponsorPayout}>
              Claim sponsor
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm font-semibold text-midnight">
          <span>Bid tape</span>
          {market.state === '1' ? <StatusPill label="Locked" tone="orange" /> : null}
        </div>
        <div className="divide-y divide-slate-100">
          {market.bids.map((bid) => (
            <div key={bid.id} className="grid items-center gap-2 px-4 py-3 text-xs text-slate-700 md:grid-cols-6">
              <div className="font-semibold text-midnight">{bid.optionLabel}</div>
              <div>{bid.trader.slice(0, 6)}...</div>
              <div>{bid.collateralIn.toFixed(2)} {market.collateralSymbol}</div>
              <div>{bid.yesOut.toFixed(2)} YES</div>
              <div>{new Date(bid.timestamp).toLocaleTimeString()}</div>
              <div className="text-right">
                <StatusPill
                  label={bid.status}
                  tone={bid.status === 'won' || bid.status === 'claimed' ? 'green' : bid.status === 'lost' ? 'slate' : 'orange'}
                />
              </div>
            </div>
          ))}
          {market.bids.length === 0 && <div className="px-4 py-4 text-xs text-slate-500">No bids yet.</div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <button type="button" className="btn-secondary" onClick={handleLock}>
          Lock window
        </button>
        <span className="text-slate-500">{panelStatus || 'Lock → resolve → release payouts to mirror the video flow.'}</span>
      </div>
    </div>
  );
}

export default function TradingWorkspace({ market, onMarketUpdate }: Props) {
  const showDemo = demoModeEnabled;
  const bidCount = market.bids.length;

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
      <div className="lg:col-span-3 space-y-4">
        <TradeForm market={market} onMarketUpdate={onMarketUpdate} />
        {showDemo && <DemoOrderBook market={market} onMarketUpdate={onMarketUpdate} />}
        {!showDemo && bidCount > 0 && <DemoOrderBook market={market} onMarketUpdate={onMarketUpdate} />}
      </div>
    </section>
  );
}
