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
  title: "Hackachusetts: the dispatch and accountability layer",
  description:
    "Every report becomes one problem, with one owner and one honest outcome.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div
          role="status"
          className="w-full bg-amber-400 text-amber-950 text-sm font-medium text-center px-4 py-1.5"
        >
          Demo mode: no real 311 cases are filed.
        </div>
        {children}
      </body>
    </html>
  );
}
