import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { TrainingBanner } from '@/components/lab/TrainingBanner';
import { LabPanel } from '@/components/lab/LabPanel';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SocialSphere — Connect, Share, Discover',
    template: '%s | SocialSphere',
  },
  description: 'SocialSphere is a modern social platform to connect with friends, share moments, and discover communities.',
  keywords: ['social media', 'social network', 'connect', 'share', 'community'],
  authors: [{ name: 'SocialSphere Team' }],
  creator: 'SocialSphere',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://socialsphere.local',
    siteName: 'SocialSphere',
    title: 'SocialSphere — Connect, Share, Discover',
    description: 'A modern social platform to connect with friends and discover communities.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SocialSphere',
    creator: '@socialsphere',
  },
  robots: {
    index: false,  // Training platform — don't index
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isTrainingMode = process.env.NEXT_PUBLIC_MODE === 'training';

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {/* ⚠️ Training Mode Banner */}
          {isTrainingMode && <TrainingBanner />}

          {/* Main Content */}
          <div className={isTrainingMode ? 'pt-8' : ''}>
            {children}
          </div>

          {/* CTF Lab Panel (visible in training mode) */}
          {isTrainingMode && <LabPanel />}
        </Providers>
      </body>
    </html>
  );
}
