import type { Metadata, Viewport } from "next";
import { Inter, Gabarito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const gabarito = Gabarito({
  subsets: ["latin"],
  variable: "--font-gabarito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeoBank - Digital Wallet",
  description: "Closed-loop INR digital wallet for instant, secure transactions",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "NeoBank",
    description: "Closed-loop INR digital wallet for instant, secure transactions",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NeoBank",
      },
    ],
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${gabarito.variable}`}>
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <main>{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
