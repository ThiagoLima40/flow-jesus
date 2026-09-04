import type { Metadata, Viewport } from "next";
import { Anton, Permanent_Marker, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { site } from "@/data/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const marker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brush",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "FLOW JESUS — Vista a fé. Viva o propósito.",
    template: "%s · FLOW JESUS",
  },
  description: site.description,
  keywords: ["streetwear cristão", "flow jesus", "isaque lima", "jiu-jitsu", "moda cristã", "bjj"],
  authors: [{ name: "Isaque Lima" }],
  openGraph: {
    title: "FLOW JESUS — Vista a fé. Viva o propósito.",
    description: site.description,
    url: site.url,
    siteName: "FLOW JESUS",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FLOW JESUS",
    description: site.description,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${anton.variable} ${marker.variable}`}>
      <body className="bg-ink text-white antialiased">
        <Providers>
          <div className="grain-overlay" aria-hidden />
          <Header />
          <main id="conteudo" className="min-h-screen">
            {children}
          </main>
          <Footer />
          <MiniPlayer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
