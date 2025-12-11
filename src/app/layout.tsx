import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use standard Inter font
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const productName = "RealSize ID PDF";
const productTitle = `${productName} | AI ID Card to A4 PDF Generator`;
const productDescription =
  "Create 85.6mm x 54mm ID cards that stay true to size on A4 sheets. Auto-crop with OpenCV, fine-tune manually, and export a print-ready PDF in seconds.";

export const generateMetadata = (): Metadata => {
  const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

  return {
    metadataBase,
    applicationName: productName,
    title: productTitle,
    description: productDescription,
    keywords: [
      "ID card to A4 PDF",
      "85.6mm x 54mm ID card",
      "badge printing template",
      "ID photo cropper",
      "OpenCV document detection",
      "A4 layout generator",
      "MockAI RealSize",
    ],
    creator: "MockAI",
    publisher: "MockAI",
    authors: [{ name: "MockAI" }],
    category: "utilities",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: productName,
      title: productTitle,
      description: productDescription,
      url: metadataBase?.href,
      images: [
        {
          url: "/window.svg",
          width: 1200,
          height: 630,
          alt: "A4 layout showing real-size ID cards ready for print.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: productTitle,
      description: productDescription,
      creator: "@MockAI",
      images: ["/window.svg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    formatDetection: {
      telephone: false,
      address: false,
    },
  };
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: productName,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    url: siteUrl || undefined,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: productDescription,
    featureList: [
      "Real-size 85.6mm x 54mm ID card layout on A4",
      "Auto-crop with corner detection, manual fine-tuning",
      "Dual-side uploads for front and back badges",
      "Instant PDF download for office and pro printers",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
