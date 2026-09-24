import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "NoticePilot | Academic Notice Intelligence",
  description:
    "Turn dense academic notices into clear, actionable information.",
  applicationName: "NoticePilot",
  keywords: [
    "academic notices",
    "student productivity",
    "notice intelligence",
    "education",
    "OCR",
  ],
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#020812] font-sans text-white">
        {children}
      </body>
    </html>
  );
}