import type { Metadata } from "next";
import { Satisfy } from "next/font/google";
import "./globals.css";

const satisfy = Satisfy({
  variable: "--font-satisfy",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${satisfy.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
