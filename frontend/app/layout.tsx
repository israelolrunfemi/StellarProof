import type { Metadata } from "next";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import "./globals.css";
import { WalletProvider } from "../context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";

export const metadata: Metadata = {
  title: "StellarProof",
  description: "The Truth Engine for the Stellar Ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
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
        className="antialiased bg-white dark:bg-darkblue text-gray-900 dark:text-gray-100 transition-colors duration-300"
      >
        <ThemeProvider>
          <ToastProvider>
            <WalletProvider>
              {children}
              <Footer />
              <ScrollToTop />
            </WalletProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
