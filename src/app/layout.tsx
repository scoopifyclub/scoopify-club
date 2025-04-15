import type { Metadata } from "next";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Scoopify - Professional Dog Waste Removal Service",
  description: "Keep your yard clean and safe with our reliable weekly dog waste removal service.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body className="font-sans">
        <div className="min-h-screen bg-gradient-to-b from-background-start to-background-end">
          <header className="container mx-auto px-4 py-4">
            <Logo />
          </header>
          {children}
          <Toaster richColors position="top-right" />
        </div>
      </body>
    </html>
  );
} 