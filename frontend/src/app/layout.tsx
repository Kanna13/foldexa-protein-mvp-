import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foldexa | Engineering Life, Digitally",
  description: "Accurate and intelligent protein structure prediction platform.",
  metadataBase: new URL("https://foldexa.bio"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logos/foldexa-logo.png",
    shortcut: "/logos/foldexa-logo.png",
    apple: "/logos/foldexa-logo.png",
  },
  openGraph: {
    title: "Foldexa | Engineering Life, Digitally",
    description: "Accurate and intelligent protein structure prediction platform.",
    url: "https://foldexa.bio",
    siteName: "Foldexa",
    images: [
      {
        url: "/logos/foldexa-logo.png",
        width: 1200,
        height: 630,
        alt: "Foldexa Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foldexa | Engineering Life, Digitally",
    description: "Accurate and intelligent protein structure prediction platform.",
    images: ["/logos/foldexa-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-foreground bg-background">
        {children}
      </body>
    </html>
  );
}
