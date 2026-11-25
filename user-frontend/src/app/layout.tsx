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

export const metadata: Metadata = {
  title: {
    default: "Afiya Shope — Luxury Abaya Boutique",
    template: "%s | Afiya Shope",
  },
  description:
    "Discover elegant Abaya styles for wholesale and retail customers across Cambodia.",
  applicationName: "Afiya Shope",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/favicon.ico",
    apple: "/images/afiya-icon.png",
  },
  openGraph: {
    title: "Afiya Shope — Luxury Abaya Boutique",
    description:
      "Discover elegant, modest Abaya styles made with premium fabrics.",
    siteName: "Afiya Shope",
    type: "website",
    images: [
      {
        url: "/images/afiyashope_logo.png",
        alt: "Afiya Shope",
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
