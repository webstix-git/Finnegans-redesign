import type { Metadata } from 'next';
import { FONT_PRELOADS } from '@/lib/fonts';
import './fonts.css';
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
  return (
    <html lang="en">
      <head>
        {FONT_PRELOADS.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
