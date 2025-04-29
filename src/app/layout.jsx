export const viewport = {
    width: "device-width",
    initialScale: 1,
};

export const metadata = {
    title: "Scoopify Club - Professional Dog Waste Removal",
    description: "Professional dog waste removal service. Keep your yard clean and enjoy more time with your pets.",
};

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

/**
 * @typedef {Object} RootLayoutProps
 * @property {React.ReactNode} children - The content to render inside the layout
 */

/**
 * Root layout component that wraps the entire application
 * @param {RootLayoutProps} props - Component props
 * @returns {JSX.Element} The RootLayout component
 */
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
        </Providers>
      </body>
    </html>);
}
