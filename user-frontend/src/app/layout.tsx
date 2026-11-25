import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import { StoreShell } from "@/components/layout/store-shell";
import { ThemeProvider } from "@/providers/theme-provider";
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

const socialShareTitle =
  "Afiya Shope | Luxury Abaya & Modest Fashion in Cambodia";
const socialShareDescription =
  "Discover elegant Abaya and modest fashion at Afiya Shope. Explore curated styles for every occasion, with wholesale and retail shopping across Cambodia.";
const socialShareImage = "/afiya-social-preview.png?v=20261125";

export const metadata: Metadata = {
  title: {
    default: "Afiya Shope — Luxury Abaya Boutique",
    template: "%s | Afiya Shope",
  },
  description: socialShareDescription,
  applicationName: "Afiya Shope",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/favicon.ico",
    apple: "/images/afiya-icon.png",
  },
  openGraph: {
    title: socialShareTitle,
    description: socialShareDescription,
    siteName: "Afiya Shope",
    url: "/",
    locale: "en_KH",
    type: "website",
    images: [
      {
        url: socialShareImage,
        width: 1200,
        height: 630,
        alt: "Afiya Shope | Luxury Abaya and modest fashion in Cambodia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: socialShareTitle,
    description: socialShareDescription,
    images: [
      {
        url: socialShareImage,
        alt: "Afiya Shope | Luxury Abaya and modest fashion in Cambodia",
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
