import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#23452F",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhanphohien.com"),
  title: {
    default: "Nguyệt Nhãn Phố Hiến | Đặc Sản Long Nhãn Tiến Vua Hưng Yên",
    template: "%s | Nguyệt Nhãn Phố Hiến",
  },
  description: "Đặc sản Long Nhãn Phố Hiến - Hưng Yên chính gốc, sấy nhiệt nóng (sấy đối lưu) 100% tự nhiên, vị ngọt thanh tao, lưu giữ trọn vẹn hương vị truyền thống ngàn xưa.",
  keywords: ["Nguyệt Nhãn Phố Hiến", "Long nhãn Hưng Yên", "Long nhãn tiến vua", "Đặc sản Hưng Yên", "Long nhãn sấy đối lưu", "Nhãn lồng Phố Hiến"],
  authors: [{ name: "Nguyệt Nhãn Phố Hiến" }],
  creator: "Nguyệt Nhãn Phố Hiến",
  publisher: "Nguyệt Nhãn Phố Hiến",
  verification: {
    google: "UbMAG2eynNZhrHLsjVfVzI9ujIb0l8brRidv0C-SMuI",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://nguyetnhanphohien.com",
    title: "Nguyệt Nhãn Phố Hiến | Đặc Sản Long Nhãn Tiến Vua Hưng Yên",
    description: "Long nhãn sấy nhiệt nóng (sấy đối lưu) tự nhiên, chuẩn vị tiến vua bãi bồi sông Hồng Hưng Yên.",
    siteName: "Nguyệt Nhãn Phố Hiến",
    images: [
      {
        url: "/logo.jpg",
        width: 800,
        height: 800,
        alt: "Logo Nguyệt Nhãn Phố Hiến",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nguyệt Nhãn Phố Hiến | Đặc Sản Long Nhãn Tiến Vua Hưng Yên",
    description: "Đặc sản Long Nhãn Phố Hiến - Hưng Yên chính gốc, sấy nhiệt nóng (sấy đối lưu) 100% tự nhiên, vị ngọt thanh tao.",
    images: ["/logo.jpg"],
  },
  alternates: {
    canonical: "/",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nguyệt Nhãn Phố Hiến",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhanphohien.com",
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhanphohien.com"}/logo.jpg`,
  image: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhanphohien.com"}/logo.jpg`,
  description: "Đặc sản Long Nhãn Phố Hiến - Hưng Yên sấy nhiệt nóng (sấy đối lưu) 100% tự nhiên, chuẩn vị tiến vua.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Phố Hiến",
    addressLocality: "Tp. Hưng Yên",
    addressRegion: "Hưng Yên",
    addressCountry: "VN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+84982072601",
    contactType: "sales",
    areaServed: "VN",
    availableLanguage: ["Vietnamese", "English"],
  },
  sameAs: [
    "https://www.facebook.com/NguyetNhanPhoHien",
    "https://zalo.me/0982072601",
    "https://www.tiktok.com/@nguyetnhan888",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased w-full max-w-full overflow-x-clip">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
