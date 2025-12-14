import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://followscan.vercel.app"),
  title: "Follow Scan - Farcaster Follow Analyzer",
  description: "Analyze your Farcaster follow relationships. Find who doesn't follow you back, mutual follows, and more.",
  openGraph: {
    title: "Follow Scan - Check Your Unfollowers",
    description: "Find out who doesn't follow you back on Farcaster",
    url: "https://followscan.vercel.app",
    siteName: "Follow Scan",
    type: "website",
    images: [
      {
        url: "https://followscan.vercel.app/preview-v2.jpg",
        width: 1200,
        height: 630,
        alt: "Follow Scan"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Follow Scan - Check Your Unfollowers",
    description: "Find out who doesn't follow you back on Farcaster",
    images: ["https://followscan.vercel.app/preview-v2.jpg"]
  },
  icons: {
    icon: "/icon.jpg",
    apple: "/icon.jpg"
  },
  other: {
    "base:app_id": "693ed644d19763ca26ddc2d3"
  },
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
