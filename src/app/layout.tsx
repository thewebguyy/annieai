import type { Metadata } from "next";
import localFont from "next/font/local";
import { Courier_Prime } from 'next/font/google';
import "./globals.css";

const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-courier',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ANNIE AI | Creative Intelligence Orchestrator",
  description: "One Workspace, Multiple Minds: The Ultimate AI Aggregator for Scriptwriters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${courierPrime.variable} antialiased bg-background text-foreground overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
