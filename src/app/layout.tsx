import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tabbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://captnime.app"),
  title: {
    default: "Captnime — Streaming Anime Sub Indo",
    template: "%s • Captnime",
  },
  description:
    "Nonton anime subtitle Indonesia dengan antarmuka cepat, katalog rapi, dan kualitas hingga 1080p. Lanjutkan tontonan kapan saja, di ponsel maupun desktop.",
  applicationName: "Captnime",
  keywords: [
    "streaming anime",
    "nonton anime",
    "anime sub indo",
    "anime subtitle indonesia",
    "captnime",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Captnime",
    title: "Captnime — Streaming Anime Sub Indo",
    description:
      "Katalog anime rapi, pemutar cepat, subtitle Indonesia, dan lanjut-tonton otomatis.",
  },
  twitter: { card: "summary_large_image", title: "Captnime" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fff7e9",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-coral focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink"
        >
          Lompat ke konten
        </a>

        <SiteHeader />

        <main id="konten" className="relative pb-16 md:pb-0">
          {children}
        </main>

        <SiteFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
