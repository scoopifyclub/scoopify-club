export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#10b981',
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scoopifyclub.com';
const defaultTitle = 'Scoopify Club | Dog Waste Removal in Peyton & Falcon, CO';
const defaultDescription =
    'Weekly dog waste removal and catch-up cleanups for Peyton, Falcon, and nearby Colorado Springs. Recurring scoop service so your yard stays usable.';

export const metadata = {
    title: {
        default: defaultTitle,
        template: '%s | Scoopify Club',
    },
    description: defaultDescription,
    keywords: [
        'dog waste removal',
        'pet waste removal',
        'poop scooping service',
        'Peyton CO',
        'Falcon CO',
        'Colorado Springs',
    ],
    authors: [{ name: 'Scoopify Club' }],
    creator: 'Scoopify Club',
    publisher: 'Scoopify Club',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(siteUrl),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteUrl,
        title: defaultTitle,
        description: defaultDescription,
        siteName: 'Scoopify Club',
        images: [
            {
                url: '/images/dogs-backyard.jpg',
                width: 1200,
                height: 630,
                alt: 'Clean backyard for dogs — Scoopify Club service in Peyton and Falcon, Colorado',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: defaultTitle,
        description: defaultDescription,
        images: ['/images/dogs-backyard.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: process.env.GOOGLE_VERIFICATION,
        yandex: process.env.YANDEX_VERIFICATION,
        yahoo: process.env.YAHOO_VERIFICATION,
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/favicon.ico',
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Scoopify Club',
    },
};

const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Scoopify Club',
    description: defaultDescription,
    url: siteUrl,
    email: 'services@scoopify.club',
    image: `${siteUrl}/images/dogs-backyard.jpg`,
    address: {
        '@type': 'PostalAddress',
        streetAddress: '7535 Gallard Heights',
        addressLocality: 'Peyton',
        addressRegion: 'CO',
        postalCode: '80831',
        addressCountry: 'US',
    },
    areaServed: [
        { '@type': 'City', name: 'Peyton', containedInPlace: { '@type': 'State', name: 'Colorado' } },
        { '@type': 'City', name: 'Falcon', containedInPlace: { '@type': 'State', name: 'Colorado' } },
        { '@type': 'City', name: 'Colorado Springs', containedInPlace: { '@type': 'State', name: 'Colorado' } },
    ],
    makesOffer: {
        '@type': 'Offer',
        itemOffered: {
            '@type': 'Service',
            name: 'Dog waste removal',
            description: 'Recurring weekly scoop service and one-time catch-up cleanups for residential yards.',
            serviceType: 'Pet waste removal',
            areaServed: ['Peyton, CO', 'Falcon, CO', 'Colorado Springs, CO'],
        },
    },
};

import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstaller } from "../components/PWAInstaller";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-body",
    display: "swap",
});

export default function RootLayout({ children }) {
    return (<html lang="en" suppressHydrationWarning className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
          <PWAInstaller />
        </Providers>
      </body>
    </html>);
}
