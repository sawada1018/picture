import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const mPlus = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-rounded",
});

export const metadata: Metadata = {
  title: "ふたりおえ",
  description: "二人で毎日お絵描きするカップル向けアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${mPlus.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-gradient-to-b from-rose-50 via-white to-purple-50 font-sans text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
