import type { Metadata } from "next";
import { Satisfy } from "next/font/google";
import "./globals.css";

const satisfy = Satisfy({
  variable: "--font-satisfy",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Word Games Hub",
  description:
    "Explore and play a variety of engaging word games to challenge your vocabulary, spelling, and creativity.",
  keywords: [
    "word games",
    "vocabulary games",
    "spelling games",
    "puzzle games",
    "word challenges",
    "brain games",
  ],
  viewport: "width=device-width, initial-scale=1.0",
  robots: "index, follow",
  themeColor: "#ffffff",
  openGraph: {
    title: "Word Games Hub",
    description:
      "Explore and play a variety of engaging word games to challenge your vocabulary, spelling, and creativity.",
    url: "https://wordgames-tau.vercel.app/",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dlklk9vme/image/upload/v1737500087/wordle_rywb1c.png",
        alt: "Word Games Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Word Games Hub",
    description:
      "Explore and play a variety of engaging word games to challenge your vocabulary, spelling, and creativity.",
    site: "@_dewaley",
    creator: "@_dewaley",
    images: [
      "https://res.cloudinary.com/dlklk9vme/image/upload/v1737500087/wordle_rywb1c.png",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${satisfy.variable} antialiased`}>{children}</body>
    </html>
  );
}
