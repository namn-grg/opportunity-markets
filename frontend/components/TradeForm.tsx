'use client';

import { FormEvent, useMemo, useState } from 'react';
import { parseUnits } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';
import { opportunityMarketAbi } from '../lib/contracts';
import { MarketMetadata } from '../lib/types';

interface Props {
  market: MarketMetadata;
}

export default function TradeForm({ market }: Props) {
  const { address, isConnected } = useAccount();
  const [selectedOption, setSelectedOption] = useState(0);
  const [collateralIn, setCollateralIn] = useState('100');
  const [maxPrice, setMaxPrice] = useState('0.65');
  const [minYesOut, setMinYesOut] = useState('100');
  const [status, setStatus] = useState('');
  const { writeContractAsync, isPending } = useWriteContract();

  const optionLabels = useMemo(() => market.options.map((opt) => opt.label), [market.options]);

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    if (!isConnected) {
      setStatus('Connect a wallet to submit the trade.');
      return;
    }
    try {
      setStatus('Preparing transaction...');
      await writeContractAsync({
        address: market.marketAddress,
        abi: opportunityMarketAbi,
        functionName: 'buyYes',
        args: [
          BigInt(selectedOption),
          parseUnits(collateralIn || '0', 18),
          parseUnits(minYesOut || '0', 18),
          parseUnits(maxPrice || '0', 18)
        ]
      });
      setStatus('Trade submitted. Settlement will finalize once the opportunity window ends.');
    } catch (error: unknown) {
      setStatus(`Unable to submit trade: ${String(error)}`);
    }
  };

  return (
    <form className="card p-5" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Trade YES</p>
          <h4 className="text-lg font-semibold text-midnight">Blind fill with slippage guardrails</h4>
        </div>
        <div className="text-xs text-slate-500">Sponsor cannot trade this market; fills are private.</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Option
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            {optionLabels.map((label, idx) => (
              <option key={label} value={idx}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Collateral in ({market.collateralSymbol})
          <input
            type="number"
            min="0"
            step="0.01"
            value={collateralIn}
            onChange={(e) => setCollateralIn(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          />
          <p className="text-xs font-normal text-slate-500">
            Approvals must cover the collateral provided. Execution price stays dark; use slippage controls to bound fills.
          </p>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Minimum YES out
          <input
            type="number"
            min="0"
            step="0.01"
            value={minYesOut}
            onChange={(e) => setMinYesOut(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Max price per YES
          <input
            type="number"
            min="0"
            step="0.01"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          />
          <p className="text-xs font-normal text-slate-500">
            We recommend targeting <span className="font-semibold">0.55-0.75</span> for early trades; the AMM reverts if the
            execution price exceeds this bound.
          </p>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit trade'}
        </button>
        <p className="text-xs text-slate-500">
          Settlement occurs after the opportunity window closes. Claims become available once the sponsor resolves. Refund math for
          NO: stake - penalty ({market.penaltyBps / 100}%).
        </p>
        {status && <p className="text-sm text-ocean">{status}</p>}
        {!isConnected && <p className="text-sm text-slate-600">Connect your wallet to place a trade.</p>}
        {address && (
          <p className="text-xs text-slate-500">Trades are tied to {address.slice(0, 6)}...{address.slice(-4)}.</p>
        )}
      </div>
    </form>
  );
}
