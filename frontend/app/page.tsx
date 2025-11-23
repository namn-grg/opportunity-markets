import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '../components/Navbar';

const featureList = [
  {
    title: 'Private quotes',
    description: 'Submit conviction without leaking price or book depth until the window closes.',
    icon: '🕶️'
  },
  {
    title: 'Two-week windows',
    description: 'Sponsors frame short timed windows that auto-lock and avoid constant repricing.',
    icon: '⏳'
  },
  {
    title: 'Sponsor guardrails',
    description: 'Penalty rails, transparency prompts, and reputation cues keep scouts aligned.',
    icon: '🛡️'
  }
];

function LandingPageContent() {
  return (
    <main className="space-y-10 pb-14">
      <Navbar />

      <section className="card flex items-center justify-center p-12">
        <Link href="/app#markets" className="btn-primary px-6 py-3 text-lg">
          Open the App
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featureList.map((feature) => (
          <div key={feature.title} className="card flex flex-col gap-3 p-5">
            <div className="text-2xl">{feature.icon}</div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-midnight">{feature.title}</h3>
              <p className="text-sm text-slate-700">{feature.description}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 px-5 py-4 text-sm text-slate-700">
        <div>
          <p className="font-semibold text-midnight">Credits</p>
          <p className="text-slate-600">
            Inspired by Paradigm Research —{' '}
            <Link className="font-medium" href="https://www.paradigm.xyz/2025/08/opportunity-markets" target="_blank">
              Opportunity Markets
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default dynamic(() => Promise.resolve(LandingPageContent), { ssr: false });
