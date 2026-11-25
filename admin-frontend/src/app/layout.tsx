import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
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
    default: "Afiya Shope Admin",
    template: "%s | Afiya Shope Admin",
  },
  description: "Afiya Shope administration dashboard for products, orders, and store settings.",
  applicationName: "Afiya Shope Admin",
  icons: {
    icon: "/favicon.ico",
    apple: "/images/afiya-icon.png",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${kantumruyPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
