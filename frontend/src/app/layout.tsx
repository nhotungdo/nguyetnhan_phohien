import type { Metadata } from "next";
import { Geist, Geist_Mono, Dancing_Script } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["vietnamese"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Nguyệt Nhãn Phố Hiến",
  description: "Tinh túy đất Phố Hiến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable}`}>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
