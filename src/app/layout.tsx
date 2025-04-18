import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Logo } from "@/components/Logo";
import { scheduleTokenCleanup } from '@/lib/cleanup'

const inter = Inter({ subsets: ["latin"] });

// Initialize token cleanup in development and production
if (process.env.NODE_ENV !== 'test') {
  scheduleTokenCleanup(60); // Run every hour
}

export const metadata: Metadata = {
  title: "Scoopify Club",
  description: "Professional pet waste removal service",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-b from-background-start to-background-end">
            <header className="container mx-auto px-4 py-4">
              <Logo />
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
} 