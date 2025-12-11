import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use standard Inter font
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RealSize ID PDF - Standard Card to A4",
  description: "Generate standard 85.6mm x 54mm ID card prints on A4 paper.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
