import Link from 'next/link';

export default function Hero() {
  return (
    <section className="card mb-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-semibold text-midnight">A calm cockpit for opaque markets</h2>
          <p className="text-slate-700">
            Scouts submit conviction without leaking price. Sponsors seed liquidity, choose a penalty policy, and resolve once the
            opportunity window lapses. Everything you need to run the hackathon demo lives here: connect a wallet, explore
            markets, trade YES with slippage bounds, and spin up new markets with a guided wizard.
          </p>
          <p className="text-sm text-slate-500">
            Pricing is deliberately dark: reserves are hidden on Sapphire and fills only finalize when the window closes. The UI
            mirrors the article’s reputational guardrails with upfront reminders and irreversible-action warnings.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/sponsor" className="btn-primary">
              Open sponsor console
            </Link>
            <Link href="#markets" className="btn-secondary">
              Browse active markets
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm text-slate-600">
          <div className="rounded-lg bg-slate-100 px-4 py-3">
            <p className="font-semibold text-midnight">Demo checklist</p>
            <ol className="list-decimal pl-4">
              <li>Sponsor: create a market with initial collateral</li>
              <li>Trader: buy YES with a max price set</li>
              <li>Wait: window closes automatically</li>
              <li>Sponsor: resolve YES/NO</li>
              <li>Trader: claim payout or refund</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
