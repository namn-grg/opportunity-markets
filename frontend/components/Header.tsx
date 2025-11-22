import WalletButton from './WalletButton';

export default function Header() {
  return (
    <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Opportunity Markets</p>
        <h1 className="text-3xl font-semibold text-midnight">Dark-pool conviction trading for scouts</h1>
      </div>
      <WalletButton />
    </header>
  );
}
