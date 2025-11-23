import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import SponsorWizard from '../../components/SponsorWizard';

function SponsorPageContent() {
  return (
    <main className="space-y-8 pb-14">
      <Navbar />
      <section className="card p-6 space-y-3 text-slate-700">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Sponsor console</p>
          <h2 className="text-2xl font-semibold text-midnight">Spin up a new opportunity window</h2>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app#markets" className="btn-secondary">
            ← Back to markets
          </Link>
        </div>
      </section>
      <SponsorWizard />
    </main>
  );
}

export default dynamic(() => Promise.resolve(SponsorPageContent), { ssr: false });
