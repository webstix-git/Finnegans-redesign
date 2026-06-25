import type { Metadata } from 'next';
import { preload } from 'react-dom';
import { BackToTop } from '@/components/BackToTop';
import { FONT_PRELOADS } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://finneganswake.com'),
  title: {
    default: "Finnegan's Wake | Downtown Springfield's Neighborhood Pub",
    template: "%s | Finnegan's Wake",
  },
  description:
    "Springfield's oldest Irish pub since 2006. Cold drinks, good food, and familiar faces at 305 South Avenue downtown.",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: "Finnegan's Wake",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/assets/87e2692a-630f-49af-a747-20365db8e0f0.webp', type: 'image/webp' },
    ],
    apple: '/assets/87e2692a-630f-49af-a747-20365db8e0f0.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  for (const href of FONT_PRELOADS) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }

  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts.css" as="style" />
        <link rel="stylesheet" href="/fonts.css" />
      </head>
      <body>
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
