import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import { StoreShell } from "@/components/layout/store-shell";
import { ThemeProvider } from "@/providers/theme-provider";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SOCIAL_DESCRIPTION,
  DEFAULT_SOCIAL_TITLE,
  getSiteMetadataBase,
} from "@/lib/site-seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-kantumruy-pro",
  subsets: ["khmer"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Afiya Shope — Luxury Abaya Boutique",
    template: "%s | Afiya Shope",
  },
  description: DEFAULT_SOCIAL_DESCRIPTION,
  applicationName: "Afiya Shope",
  metadataBase: getSiteMetadataBase(),
  icons: {
    icon: "/favicon.ico",
    apple: "/images/afiya-icon.png",
  },
  openGraph: {
    title: DEFAULT_SOCIAL_TITLE,
    description: DEFAULT_SOCIAL_DESCRIPTION,
    siteName: "Afiya Shope",
    locale: "en_KH",
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: DEFAULT_SOCIAL_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SOCIAL_TITLE,
    description: DEFAULT_SOCIAL_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        alt: DEFAULT_SOCIAL_TITLE,
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${kantumruyPro.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <StoreShell>{children}</StoreShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
