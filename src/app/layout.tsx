import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { WebsiteAssistant } from "@/components/website-assistant";
import { FloatingNav } from "@/components/floating-nav";
import { ShowcaseProvider } from "@/components/showcase-provider";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "CrisisSync",
    template: "%s | CrisisSync",
  },
  description:
    "AI-powered real-time emergency coordination platform for hospitality venues. Unify guest reporting, staff response, and incident management.",
  keywords: ["emergency", "crisis management", "hospitality", "hotel safety", "real-time coordination"],
  openGraph: {
    title: "CrisisSync",
    description: "Emergency coordination that thinks in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ShowcaseProvider>
          <FloatingNav />
          {children}
          <WebsiteAssistant />
          <Toaster richColors position="top-right" />
        </ShowcaseProvider>
      </body>
    </html>
  );
}
