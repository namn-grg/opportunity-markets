'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RainbowKitConnectButton } from './RainbowKitConnectButton';

export default function Navbar() {
  const pathname = usePathname();
  const isSponsor = pathname === '/sponsor';

  return (
    <nav className="sticky top-0 z-30 mb-10 backdrop-blur">
      <div className="card flex items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
            Opportunity Markets
          </Link>
          <span className="hidden text-slate-300 md:inline">|</span>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Link href="/app#markets" className="hover:text-ocean">
              Markets
            </Link>
            <Link href="/sponsor" className={`hover:text-ocean ${isSponsor ? 'text-ocean' : ''}`}>
              Sponsor
            </Link>
          </div>
        </div>
        <RainbowKitConnectButton />
      </div>
    </nav>
  );
}
