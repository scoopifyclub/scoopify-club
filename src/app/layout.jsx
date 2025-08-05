export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#10b981',
};

export const metadata = {
    title: {
        default: "Scoopify Club - Professional Dog Waste Removal Service",
        template: "%s | Scoopify Club"
    },
    description: "Professional dog waste removal service in Colorado. Keep your yard clean and enjoy more time with your pets. Serving Denver, Boulder, Aurora, and surrounding areas.",
    keywords: [
        "dog waste removal",
        "poop scooping service",
        "yard cleaning",
        "pet waste removal",
        "Colorado",
        "Denver",
        "Boulder",
        "Aurora",
        "professional cleaning",
        "residential cleaning"
    ],
    authors: [{ name: "Scoopify Club" }],
    creator: "Scoopify Club",
    publisher: "Scoopify Club",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://scoopifyclub.com'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://scoopifyclub.com',
        title: 'Scoopify Club - Professional Dog Waste Removal Service',
        description: 'Professional dog waste removal service in Colorado. Keep your yard clean and enjoy more time with your pets.',
        siteName: 'Scoopify Club',
        images: [
            {
                url: '/images/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Scoopify Club - Professional Dog Waste Removal',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Scoopify Club - Professional Dog Waste Removal Service',
        description: 'Professional dog waste removal service in Colorado. Keep your yard clean and enjoy more time with your pets.',
        images: ['/images/twitter-image.jpg'],
        creator: '@scoopifyclub',
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

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstaller } from "../components/PWAInstaller";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
    return (<html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
