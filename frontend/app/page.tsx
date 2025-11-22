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

export default function LandingPage() {
  return (
    <main className="space-y-10 pb-14">
      <Navbar />

      <section className="card p-8">
        <div className="grid gap-8 lg:grid-cols-3 lg:items-center">
          <div className="space-y-4 lg:col-span-2">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Private conviction, timed releases</p>
            <h1 className="text-3xl font-semibold text-midnight">Dark trading built for opportunity windows</h1>
            <p className="text-slate-700">
              Submit conviction without leaking price. Scouts trade YES inside sponsor-defined windows, while Sapphire keeps
              quotes private until the timer ends.
            </p>
            <p className="text-slate-700">
              Sponsors lock the clock, set penalties, and resolve transparently when the window closes. The flow mirrors the
              Opportunity Markets story—calm, privacy-first, and ready to demo.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Dark trading with no live price feed until the window expires.</li>
              <li>Timed windows that encourage prepared conviction over noisy churn.</li>
              <li>Reputational safety rails with penalties and clear sponsor responsibilities.</li>
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/app#markets" className="btn-primary">
                Open the App
              </Link>
              <Link href="#policy" className="btn-secondary">
                Read how it works
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              Inspired by Paradigm Research —{' '}
              <Link className="font-medium" href="https://www.paradigm.xyz/2025/08/opportunity-markets" target="_blank">
                Opportunity Markets
              </Link>
            </p>
          </div>
          <div className="space-y-3 rounded-xl bg-slate-50 p-6 text-sm text-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              <span>Why this works</span>
              <span>Sapphire</span>
            </div>
            <p className="text-midnight">
              Submit conviction without leaking price.
              <br />
              Sponsors lock windows, set penalties, and resolve transparently.
              <br />
              Built on Sapphire privacy — no price feeds until the window closes.
            </p>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
              <p className="font-semibold text-midnight">Inline demo</p>
              <p>
                Launch the app to browse markets, select one, and trade without leaving the workspace. Everything stays in a
                single split-screen view.
              </p>
            </div>
          </div>
        </div>
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

      <section id="policy" className="card space-y-4 p-6 text-slate-700">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Policy drawer</p>
          <h2 className="text-xl font-semibold text-midnight">How the flow stays calm</h2>
        </div>
        <p>
          We mirror the Opportunity Markets article: dark pricing, delayed fills, and reputational guardrails. Penalty basis
          points discourage frivolous NO outcomes; sponsors cannot trade their own markets. Storage confidentiality lives on
          Oasis Sapphire, so the UI avoids surfacing reserve data and nudges users to think in windows instead of ticks.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Opportunity windows default to ~two weeks; countdowns are front-and-center.</li>
          <li>Trade forms require slippage bounds (maxPrice) and min YES out to avoid price surprises.</li>
          <li>Resolution CTAs live in the sponsor console and warn before irreversible steps.</li>
          <li>Portfolio ideas: claim reminders and CSV export can slot into this layout post-hackathon.</li>
        </ul>
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
        <Link href="/app#markets" className="btn-primary">
          Open the App
        </Link>
      </section>
    </main>
  );
}
