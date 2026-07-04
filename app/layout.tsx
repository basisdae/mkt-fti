import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import {
  APP_AUTHOR,
  APP_DESCRIPTION,
  APP_THEME_COLOR,
  APP_TITLE,
} from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: APP_TITLE,
  title: {
    default: APP_TITLE,
    template: `${APP_TITLE} | %s`,
  },
  description: APP_DESCRIPTION,
  authors: [{ name: APP_AUTHOR }],
  creator: APP_AUTHOR,
  publisher: APP_AUTHOR,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    title: APP_TITLE,
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: APP_THEME_COLOR,
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
