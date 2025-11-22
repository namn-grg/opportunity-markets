'use client';

import { FormEvent, useState } from 'react';
import { keccak256, stringToBytes, parseUnits } from 'viem';
import { useAccount, useContractWrite } from 'wagmi';
import { opportunityFactoryAbi } from '../lib/contracts';
import { sapphireTestnet } from '../lib/chains';

const defaultQuestion = 'Which scout submission should the lab back this month?';

export default function SponsorWizard() {
  const { address } = useAccount();
  const { writeAsync, isLoading } = useContractWrite({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: opportunityFactoryAbi,
    functionName: 'createMarket',
    chainId: sapphireTestnet.id,
    mode: 'recklesslyUnprepared'
  });
  const [question, setQuestion] = useState(defaultQuestion);
  const [penaltyBps, setPenaltyBps] = useState(500);
  const [windowEnd, setWindowEnd] = useState('');
  const [collateralToken, setCollateralToken] = useState('0x0000000000000000000000000000000000000000');
  const [optionLabels, setOptionLabels] = useState(['Artist A', 'Artist B']);
  const [initialCollateral, setInitialCollateral] = useState('1000');
  const [status, setStatus] = useState('');

  const handleAddOption = () => setOptionLabels((opts) => [...opts, `Option ${opts.length + 1}`]);

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    setStatus('Preparing deployment...');
    try {
      if (!writeAsync) {
        setStatus('Wallet client not ready. Please reconnect and try again.');
        return;
      }
      const questionHash = keccak256(stringToBytes(question));
      const opportunityWindowEnd = windowEnd ? Math.floor(new Date(windowEnd).getTime() / 1000) : 0;
      const options = optionLabels.map((label) => ({
        optionHash: keccak256(stringToBytes(label)),
        initialCollateral: parseUnits(initialCollateral || '0', 18),
        initialVirtualYes: parseUnits((Number(initialCollateral || '0') / optionLabels.length).toString(), 18)
      }));

      await writeAsync({
        args: [
          {
            sponsor: address as `0x${string}`,
            collateralToken: collateralToken as `0x${string}`,
            penaltyBps,
            opportunityWindowEnd,
            questionHash,
            options
          }
        ]
      });
      setStatus('Market created. Copy the address from your wallet receipt and share it with scouts.');
    } catch (error: unknown) {
      setStatus(`Unable to create market: ${String(error)}`);
    }
  };

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Sponsor console</p>
          <h3 className="text-xl font-semibold text-midnight">Launch a new opportunity window</h3>
        </div>
        <div className="text-xs text-slate-500">Only owners can resolve and claim sponsor payouts.</div>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Question prompt
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
            <p className="text-xs font-normal text-slate-500">Hashed client-side; full text stays off-chain.</p>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Penalty (bps)
              <input
                type="number"
                min="0"
                max="3000"
                value={penaltyBps}
                onChange={(e) => setPenaltyBps(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <p className="text-xs font-normal text-slate-500">0-30% suggested per the article.</p>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Opportunity window end
              <input
                type="datetime-local"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <p className="text-xs font-normal text-slate-500">Default: two weeks from creation.</p>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Collateral token address
              <input
                type="text"
                value={collateralToken}
                onChange={(e) => setCollateralToken(e.target.value as `0x${string}`)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Initial collateral per option
              <input
                type="number"
                min="0"
                step="0.01"
                value={initialCollateral}
                onChange={(e) => setInitialCollateral(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <p className="text-xs font-normal text-slate-500">Budget equals collateral * option count.</p>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-midnight">Options</p>
            <button type="button" className="btn-secondary" onClick={handleAddOption}>
              Add option
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {optionLabels.map((label, idx) => (
              <input
                key={idx}
                type="text"
                value={label}
                onChange={(e) =>
                  setOptionLabels((opts) => opts.map((opt, optIdx) => (optIdx === idx ? e.target.value : opt)))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            ))}
          </div>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-midnight">Resolution safety rails</p>
          <p>
            Locking will auto-trigger when the window closes. Sponsors can call resolveYes/resolveNo and later claim penalties or
            residuals. The UI intentionally avoids broadcasting prices to align with Sapphire storage privacy.
          </p>
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading || !writeAsync}>
          {isLoading ? 'Deploying...' : 'Create market'}
        </button>
        {status && <p className="text-sm text-ocean">{status}</p>}
      </form>
    </section>
  );
}
