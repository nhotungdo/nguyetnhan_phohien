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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhan.vn"),
  title: {
    default: "Nguyệt Nhãn Phố Hiến | Đặc Sản Long Nhãn Tiến Vua Hưng Yên",
    template: "%s | Nguyệt Nhãn Phố Hiến",
  },
  description: "Đặc sản Long Nhãn Phố Hiến - Hưng Yên chính gốc, sấy củi nhãn thủ công 100% tự nhiên, vị ngọt thanh tao, lưu giữ trọn vẹn hương vị truyền thống ngàn xưa.",
  keywords: ["Nguyệt Nhãn Phố Hiến", "Long nhãn Hưng Yên", "Long nhãn tiến vua", "Đặc sản Hưng Yên", "Long nhãn sấy củi", "Nhãn lồng Phố Hiến"],
  authors: [{ name: "Nguyệt Nhãn Phố Hiến" }],
  creator: "Nguyệt Nhãn Phố Hiến",
  publisher: "Nguyệt Nhãn Phố Hiến",
  icons: {
    icon: [
      { url: "/logo.jpg", sizes: "any" },
      { url: "/logo.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    shortcut: "/logo.jpg",
    apple: [
      { url: "/logo.jpg", sizes: "180x180", type: "image/jpeg" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://nguyetnhan.vn",
    title: "Nguyệt Nhãn Phố Hiến | Đặc Sản Long Nhãn Tiến Vua Hưng Yên",
    description: "Long nhãn sấy củi tự nhiên, chuẩn vị tiến vua bãi bồi sông Hồng Hưng Yên.",
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
    description: "Đặc sản Long Nhãn Phố Hiến - Hưng Yên chính gốc, sấy củi nhãn thủ công 100% tự nhiên, vị ngọt thanh tao.",
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
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhan.vn",
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhan.vn"}/logo.jpg`,
  image: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhan.vn"}/logo.jpg`,
  description: "Đặc sản Long Nhãn Phố Hiến - Hưng Yên sấy củi thủ công 100% tự nhiên, chuẩn vị tiến vua.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
