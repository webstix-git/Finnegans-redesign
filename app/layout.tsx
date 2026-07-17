import type { Metadata } from 'next';
import Script from 'next/script';
import { preload } from 'react-dom';
import { BackToTop } from '@/components/BackToTop';
import { FONT_PRELOADS } from '@/lib/fonts';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.finneganswakesgf.com';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || '';

const LOCAL_BUSINESS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BarOrPub',
  '@id': `${SITE_URL}/#business`,
  name: "Finnegan's Wake",
  alternateName: "Finnegan's Wake Irish Pub",
  description:
    "Springfield's oldest Irish pub since 2006. Cold drinks, good food, and familiar faces at 305 South Avenue downtown.",
  url: SITE_URL,
  telephone: '+1-417-869-1500',
  email: 'finneganssgf@gmail.com',
  image: `${SITE_URL}/assets/87e2692a-630f-49af-a747-20365db8e0f0.webp`,
  logo: `${SITE_URL}/assets/87e2692a-630f-49af-a747-20365db8e0f0.webp`,
  foundingDate: '2006',
  priceRange: '$$',
  servesCuisine: ['Irish', 'American', 'Pub Food'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '305 South Avenue',
    addressLocality: 'Springfield',
    addressRegion: 'MO',
    postalCode: '65806',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 37.208,
    longitude: -93.2925,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '16:00',
      closes: '23:59',
    },
  ],
  menu: `${SITE_URL}/menu`,
  sameAs: [
    'https://www.facebook.com/finneganssgf/',
    'https://www.instagram.com/finneganssgf/',
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD) }}
        />
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
