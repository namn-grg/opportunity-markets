import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '../providers/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Opportunity Markets',
  description:
    'Sponsor-seeded, privacy-preserving prediction markets for scouts and partners.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
