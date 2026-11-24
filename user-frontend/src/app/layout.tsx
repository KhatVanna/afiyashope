import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Afiya Shope — Luxury Abaya Boutique",
    template: "%s | Afiya Shope",
  },
  description:
    "Abaya Collection • បោះដុំ និងលក់រាយ ២៥ ខេត្ត-ក្រុង",
  applicationName: "Afiya Shope",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/favicon.ico",
    apple: "/images/afiya-icon.png",
  },
  openGraph: {
    title: "Afiya Shope — Luxury Abaya Boutique",
    description:
      "ម៉ូដ Abaya ទាន់សម័យ សុភាពរាបសារ និងប្រណិតភាព",
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
      lang="km"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
