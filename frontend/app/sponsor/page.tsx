import Link from 'next/link';
import Navbar from '../../components/Navbar';
import SponsorWizard from '../../components/SponsorWizard';

export default function SponsorPage() {
  return (
    <main className="space-y-8 pb-14">
      <Navbar />
      <section className="card p-6 space-y-3 text-slate-700">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Sponsor console</p>
          <h2 className="text-2xl font-semibold text-midnight">Spin up a new opportunity window</h2>
        </div>
        <p>
          Hash prompts and option text client-side, pick a penalty policy, and deploy through the Opportunity Factory. Once the
          window closes, return here to resolve YES or NO and reclaim unused collateral.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Collateral and option metadata stay private on Sapphire until you choose to reveal the results.</li>
          <li>Each option shares the same initial collateral; adjust the text fields below to represent scout submissions.</li>
        </ul>
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
