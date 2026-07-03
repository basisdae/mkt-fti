import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MKT-FTI | Product Command Center",
    template: "%s | MKT-FTI",
  },
  description: "Internal Marketing Product Command Center for FTI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
