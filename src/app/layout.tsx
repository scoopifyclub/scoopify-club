import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Scoopify Club",
  description: "Your premier ice cream service management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} ${poppins.variable} antialiased`}>
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