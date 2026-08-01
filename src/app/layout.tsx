import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mydpix.com"),
  title: {
    default: "MyDpix AI — Turn any situation into a meme",
    template: "%s · MyDpix AI",
  },
  description:
    "Describe any situation and MyDpix AI generates authentic, shareable memes — built on internet humor, Naija culture, and viral formats. Search and download thousands more.",
  keywords: ["meme generator", "AI memes", "Nigerian memes", "naija memes", "meme maker", "dp", "wallpapers"],
  openGraph: {
    title: "MyDpix AI — Turn any situation into a meme",
    description: "Describe it. We'll meme it.",
    url: "https://www.mydpix.com",
    siteName: "MyDpix AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyDpix AI",
    description: "Describe any situation. Get memes.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-base-950 text-ink-100 antialiased`}>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: "#1D1A18", color: "#F5F1EC", border: "1px solid #2A2523" },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
