import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import "./globals.css";
import { WalletProvider } from "../context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StellarProof - The Truth Engine for Digital Content",
  description: "Verifiable digital authenticity powered by Soroban smart contracts. Cryptographically signed verification for digital content and media ecosystems.",
  keywords: "stellar, blockchain, verification, authenticity, soroban, smart contracts",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: "#256af4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      {/* Top accent line */}
      <style>{`
        html::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(to right, #ff7ce9, #ff7ce9, #ff7ce9);
          z-index: 100;
        }
      `}</style>
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('stellarproof-theme');
                  if (!stored) {
                    stored = 'dark';
                    localStorage.setItem('stellarproof-theme', stored);
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
                  var isDark = stored !== 'light';
                  document.documentElement.classList.toggle('dark', isDark);
                  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-darkblue-dark text-gray-900 dark:text-gray-100 transition-colors duration-300`}
      >
        <ThemeProvider>
          <WalletProvider>
            {children}
            <Footer />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
