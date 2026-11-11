import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ClickSoundListener from '@/components/ClickSoundListener';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://labora.nikhil-dev.in';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Saveetha Lab Record Generator | Labora - SEC Lab Records & QR Format',
    template: '%s | Labora - Lab Record Generator',
  },
  description:
    'Saveetha Engineering College lab record generator. Create SEC format records with auto QR codes and export standardized PDF/DOCX records instantly.',
  applicationName: 'Labora',
  authors: [{ name: 'Nikhil R', url: 'https://nikhil-dev.in' }],
  generator: 'Next.js',
  keywords: [
    'saveetha lab record generator',
    'lab record generator',
    'labora',
    'saveetha lab records',
    'saveetha engineering college lab record',
    'sec lab record format',
    'lab record pdf generator',
    'qr code lab record generator',
    'anna university lab record format',
    'saveetha table of contents generator',
    'saveetha engineering college',
    'labora lab generator',
  ],
  creator: 'Nikhil R',
  publisher: 'Labora',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Saveetha Lab Record Generator | Labora',
    description:
      'The #1 client-side lab record generator for Saveetha Engineering College. Build verified table of contents, embed GitHub repo QR codes, and export standardized PDFs in seconds.',
    url: siteUrl,
    siteName: 'Labora',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/images/college-logo.png',
        width: 1200,
        height: 630,
        alt: 'Labora - Saveetha Engineering College Lab Record Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saveetha Lab Record Generator | Labora',
    description:
      'Generate formatted Saveetha Engineering College lab records with automated GitHub verification QR codes and PDF/DOCX downloads.',
    images: ['/images/college-logo.png'],
  },
  icons: {
    icon: [
      { url: '/images/college-logo.png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/images/college-logo.png',
  },
  category: 'education',
};

const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#webapp`,
      name: 'Labora - Saveetha Lab Record Generator',
      alternateName: [
        'Labora',
        'Saveetha Lab Record Generator',
        'Lab Record Generator',
        'SEC Lab Record Generator',
      ],
      url: siteUrl,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Works in Chrome, Edge, Safari, Firefox.',
      description:
        'Client-side generator to build formatted Saveetha Engineering College lab records with automatic experiment numbering, instant QR codes, and PDF/DOCX downloads.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      featureList: [
        'Saveetha Engineering College Table of Contents Format',
        'Instant Client-Side QR Code Generation for GitHub Solutions',
        'Automatic Sequential Experiment Numbering',
        'Direct 1-Click PDF and DOCX Exports',
        'Secure 100% Client-Side In-Memory Processing',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Labora',
      publisher: {
        '@type': 'Organization',
        name: 'Labora Workspace',
        url: siteUrl,
        logo: `${siteUrl}/images/college-logo.png`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Labora?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Labora is a client-side document automation web app designed to generate standardized Saveetha Engineering College (SEC) and Anna University lab records, auto-format index tables, and generate QR codes for experiment repositories.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the Saveetha lab record generator work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Students input their experiment titles, dates, and code repository links. Labora converts the repository URLs into scannable verification QR codes and formats the entire document strictly according to Saveetha autonomous regulations.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does it support official Saveetha Engineering College formats?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, the output strictly satisfies the Saveetha Engineering College format including Experiment Number, Date, Experiment Name, Verification QR Code, Marks, and Staff Signature columns.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I download the records as PDF and Word DOCX?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Labora allows direct client-side generation and export to both standardized PDF and fully editable Microsoft Word (.docx) formats.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={`${siteUrl}/`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Josefin+Sans:wght@400;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased transition-colors duration-150">
        <ThemeProvider>
          <AuthProvider>
            <ClickSoundListener />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
