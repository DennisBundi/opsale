import type { Metadata, Viewport } from "next";
import "./globals.css";
import CartNotificationProvider from "@/components/cart/CartNotificationProvider";
import PWARegister from "@/components/PWARegister";
import InstallPrompt from "@/components/InstallPrompt";
import PWAMetaTags from "@/components/PWAMetaTags";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "OpSale — Sell. Retain. Grow.",
  description: "Multi-tenant SaaS platform for modern sellers worldwide.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpSale",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f9a8d4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="light" storageKey="opsale-theme" enableSystem={false}>
          <PWAMetaTags />
          <PWARegister />
          <main className="flex-grow">{children}</main>
          <CartNotificationProvider />
          <InstallPrompt />
          <PWAUpdatePrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
