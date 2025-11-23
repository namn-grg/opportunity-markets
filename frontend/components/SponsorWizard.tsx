'use client';

import { FormEvent, useState } from 'react';
import { decodeEventLog, keccak256, stringToBytes, parseUnits, erc20Abi, formatUnits } from 'viem';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { createDemoMarket, demoModeEnabled } from '../lib/demoState';
import { opportunityFactoryAbi } from '../lib/contracts';
import { sapphireTestnet } from '../lib/chains';

const defaultQuestion = 'Which scout submission should the lab back this month?';
const defaultCollateral =
  (process.env.NEXT_PUBLIC_COLLATERAL_TOKEN as `0x${string}` | undefined) ??
  '0x0000000000000000000000000000000000000000';

export default function SponsorWizard() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [question, setQuestion] = useState(defaultQuestion);
  const [penaltyBps, setPenaltyBps] = useState(500);
  const [windowEnd, setWindowEnd] = useState('');
  const [collateralToken, setCollateralToken] = useState<`0x${string}`>(defaultCollateral);
  const [optionLabels, setOptionLabels] = useState(['Artist A', 'Artist B']);
  const [initialCollateral, setInitialCollateral] = useState('1000');
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [createdMarket, setCreatedMarket] = useState<`0x${string}` | null>(null);
  const publicClient = usePublicClient();
  const isDemo = demoModeEnabled;

  const handleAddOption = () => setOptionLabels((opts) => [...opts, `Option ${opts.length + 1}`]);

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    if (!address && !isDemo) {
      setStatus('Connect your wallet to create a market.');
      return;
    }
    const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined;
    if (!factoryAddress && !isDemo) {
      setStatus('Factory address missing. Set NEXT_PUBLIC_FACTORY_ADDRESS.');
      return;
    }
    if (collateralToken === '0x0000000000000000000000000000000000000000' && !isDemo) {
      setStatus('Enter a collateral token address before deploying.');
      return;
    }
    setStatus(isDemo ? 'Creating market...' : 'Preparing deployment...');
    try {
      if (isDemo) {
        const market = createDemoMarket({
          question,
          penaltyBps,
          windowEnd,
          collateralToken,
          optionLabels,
          initialCollateral,
          sponsor: address ?? null,
          collateralSymbol: 'USDC'
        });
        setCreatedMarket(market.marketAddress);
        setStatus('Market created. Head to the App page to trade, resolve, and claim payouts.');
        setTxHash(null);
        return;
      }
      if (!address) {
        setStatus('Connect your wallet to create a market.');
        return;
      }
      const sponsorAddress = address as `0x${string}`;
      const factoryAddr = factoryAddress as `0x${string}`;
      if (!publicClient) {
        setStatus('Public client unavailable. Check your wallet connection.');
        return;
      }
      setStatus('Fetching token decimals...');
      const decimals = Number(
        await publicClient.readContract({
          address: collateralToken,
          abi: erc20Abi,
          functionName: 'decimals'
        })
      );
      const perOptionCollateral = parseUnits(initialCollateral || '0', decimals);
      const perOptionVirtualYes = perOptionCollateral / BigInt(Math.max(optionLabels.length, 1));
      if (perOptionCollateral === 0n || perOptionVirtualYes === 0n) {
        setStatus('Initial collateral too low for selected token decimals.');
        return;
      }
      const totalInitialCollateral = perOptionCollateral * BigInt(optionLabels.length);

      setStatus('Checking balance...');
      const balance = await publicClient.readContract({
        address: collateralToken,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [sponsorAddress]
      });
      if (balance < totalInitialCollateral) {
        setStatus(
          `Insufficient collateral. Need ${formatUnits(totalInitialCollateral, decimals)}, balance ${formatUnits(
            balance,
            decimals
          )}.`
        );
        return;
      }

      const questionHash = keccak256(stringToBytes(question));
      const opportunityWindowEndSeconds = windowEnd ? Math.floor(new Date(windowEnd).getTime() / 1000) : 0;
      const options = optionLabels.map((label) => ({
        optionHash: keccak256(stringToBytes(label)),
        initialCollateral: perOptionCollateral,
        initialVirtualYes: perOptionVirtualYes
      }));
      setStatus('Checking allowance...');
      const allowance = await publicClient.readContract({
        address: collateralToken,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [sponsorAddress, factoryAddr]
      });
      if (allowance < totalInitialCollateral) {
        setStatus('Requesting collateral approval...');
        const approvalHash = await writeContractAsync({
          address: collateralToken,
          abi: erc20Abi,
          functionName: 'approve',
          args: [factoryAddr, totalInitialCollateral],
          chainId: sapphireTestnet.id
        });
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        setStatus('Allowance granted. Deploying market...');
      } else {
        setStatus('Allowance sufficient. Deploying market...');
      }

      const hash = await writeContractAsync({
        address: factoryAddr,
        abi: opportunityFactoryAbi,
        functionName: 'createMarket',
        chainId: sapphireTestnet.id,
        args: [
          {
            sponsor: sponsorAddress,
            collateralToken: collateralToken as `0x${string}`,
            penaltyBps,
            opportunityWindowEnd: BigInt(opportunityWindowEndSeconds),
            questionHash,
            options
          }
        ]
      });
      setTxHash(hash);
      setStatus('Waiting for confirmation...');

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const marketCreatedLog = receipt.logs.find((log) => log.address.toLowerCase() === factoryAddr.toLowerCase());
        if (marketCreatedLog) {
          const decoded = decodeEventLog({
            abi: opportunityFactoryAbi,
            data: marketCreatedLog.data,
            topics: marketCreatedLog.topics
          });
          const marketAddr = (decoded.args as { market: `0x${string}` }).market;
          setCreatedMarket(marketAddr);
          setStatus('Market created and confirmed on-chain.');
        } else {
          setStatus('Transaction confirmed. Check explorer for details.');
        }
      } else {
        setStatus('Transaction sent. Check explorer for confirmation.');
      }
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
                value={penaltyBps}
                onChange={(e) => setPenaltyBps(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
              <p className="text-xs font-normal text-slate-500">eg: 20%</p>
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
              <p className="text-xs font-normal text-slate-500">Default: USDC token</p>
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
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Deploying...' : 'Create market'}
        </button>
        {status && <p className="text-sm text-ocean">{status}</p>}
        {txHash && (
          <p className="text-xs text-slate-600">
            Tx: <a className="text-ocean underline" href={`${sapphireTestnet.blockExplorers?.default.url}/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a>
          </p>
        )}
        {createdMarket && (
          <p className="text-sm text-midnight">
            Market address: <span className="font-mono">{createdMarket}</span>
          </p>
        )}
      </form>
    </section>
  );
}
