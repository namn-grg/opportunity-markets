'use client';

import { FormEvent, useMemo, useState } from 'react';
import { parseUnits } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';
import { demoModeEnabled, recordDemoBid } from '../lib/demoState';
import { opportunityMarketAbi } from '../lib/contracts';
import { DemoMarket } from '../lib/types';

const erc20Abi = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  }
] as const;

interface Props {
  market: DemoMarket;
  onMarketUpdate?: (market: DemoMarket) => void;
}

export default function TradeForm({ market, onMarketUpdate }: Props) {
  const { address, isConnected } = useAccount();
  const [selectedOption, setSelectedOption] = useState(0);
  const [collateralIn, setCollateralIn] = useState('100');
  const [maxPrice, setMaxPrice] = useState('0.65');
  const [minYesOut, setMinYesOut] = useState('100');
  const [status, setStatus] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const { writeContractAsync, isPending } = useWriteContract();
  const isDemo = demoModeEnabled;

  const optionLabels = useMemo(() => market.options.map((opt) => opt.label), [market.options]);

  const handleApprove = async () => {
    if (isDemo) {
      setStatus('Allowance already handled for this market. You can submit the trade directly.');
      return;
    }
    if (!isConnected) {
      setStatus('Connect a wallet before approving collateral.');
      return;
    }
    if (!market.collateralAddress) {
      setStatus('Collateral token address missing for this market.');
      return;
    }
    try {
      setIsApproving(true);
      setStatus('Sending approval for collateral spend...');
      await writeContractAsync({
        address: market.collateralAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [market.marketAddress, parseUnits(collateralIn || '0', 18)]
      });
      setStatus('Approval submitted. You can now submit the trade.');
    } catch (error: unknown) {
      setStatus(`Approval failed: ${String(error)}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    if (isDemo) {
      const collateralAmount = Number(collateralIn || '0');
      if (!Number.isFinite(collateralAmount) || collateralAmount <= 0) {
        setStatus('Enter a positive collateral amount to submit the trade.');
        return;
      }
      const parsedMaxPrice = Number(maxPrice || '0.65');
      const updated = recordDemoBid({
        marketId: market.id,
        trader: address ?? undefined,
        optionId: selectedOption,
        collateralIn: collateralAmount,
        maxPrice: Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : 0.65
      });
      if (updated) {
        onMarketUpdate?.(updated);
        const placed = updated.bids[0];
        setStatus(
          `Trade submitted: ${placed.collateralIn.toFixed(2)} ${market.collateralSymbol} -> ${placed.yesOut.toFixed(
            2
          )} YES on ${placed.optionLabel}.`
        );
      } else {
        setStatus('Unable to record the trade.');
      }
      return;
    }
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
        <div className="text-xs text-slate-500">
          {isDemo ? 'Allowance and fills are pre-authorized for this market.' : 'Sponsor cannot trade this market; fills are private.'}
        </div>
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-secondary" disabled={isApproving || isPending} onClick={handleApprove}>
            {isApproving ? 'Approving...' : 'Approve collateral'}
          </button>
          <button type="submit" className="btn-primary" disabled={isPending || isApproving}>
            {isPending ? 'Submitting...' : 'Submit trade'}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {isDemo
            ? 'This market is pre-authorized. Submit a bid, lock the market, resolve, and release payouts to show the full flow.'
            : `You must approve the market contract to spend your collateral before trading. Settlement occurs after the opportunity window closes. Claims become available once the sponsor resolves. Refund math for NO: stake - penalty (${market.penaltyBps / 100}%).`}
        </p>
        {status && <p className="text-sm text-ocean">{status}</p>}
        {!isConnected && !isDemo && <p className="text-sm text-slate-600">Connect your wallet to place a trade.</p>}
        {address && (
          <p className="text-xs text-slate-500">Trades are tied to {address.slice(0, 6)}...{address.slice(-4)}.</p>
        )}
      </div>
    </form>
  );
}
