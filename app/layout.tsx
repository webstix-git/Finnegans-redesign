import type { Metadata } from 'next';
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
