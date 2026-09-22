import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMS Korporat Vanguard",
  description: "Enterprise Document Management",
};

import { TRPCReactProvider } from "@/trpc/client";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <NuqsAdapter>
          <TRPCReactProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </TRPCReactProvider>
        </NuqsAdapter>
        <Analytics />
      </body>
    </html>
  );
}

