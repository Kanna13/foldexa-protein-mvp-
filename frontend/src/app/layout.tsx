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
  description:
    "Accurate and intelligent protein structure prediction platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-neutral-100 font-sans antialiased">

        {/* ===================== */}
        {/* GLOBAL BACKGROUND SYSTEM */}
        {/* ===================== */}

        {/* Base gradient depth */}
        <div className="fixed inset-0 -z-50 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />

        {/* Subtle tech grid */}
        <div
          className="
            fixed inset-0 -z-40 opacity-[0.05]
            bg-[linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),
                linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)]
            bg-[size:48px_48px]
          "
        />

        {/* Accent glow — brand atmosphere */}
        <div
          className="
            fixed inset-0 -z-30 pointer-events-none
            bg-[radial-gradient(circle_at_20%_10%,rgba(0,255,148,0.12),transparent_45%)]
          "
        />

        {/* Cinematic vignette */}
        <div className="fixed inset-0 -z-20 bg-gradient-to-b from-transparent via-transparent to-black/50" />

        {/* ===================== */}
        {/* APPLICATION CONTENT */}
        {/* ===================== */}

        <main className="relative z-10">
          {children}
        </main>

      </body>
    </html>
  );
}