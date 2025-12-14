import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Follow Scan - Farcaster Follow Analyzer",
  description: "Analyze your Farcaster follow relationships. Find who doesn't follow you back, mutual follows, and more.",
  openGraph: {
    title: "Follow Scan - Check Your Unfollowers",
    description: "Find out who doesn't follow you back on Farcaster",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
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
    images: ["/og-image.jpg"]
  },
  icons: {
    icon: "/icon.jpg",
    apple: "/icon.jpg"
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "/og-image.jpg",
    "fc:frame:button:1": "Check Unfollowers",
    "fc:frame:button:1:action": "launch_frame",
    "fc:frame:button:1:target": "https://followscan.vercel.app"
  }
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
