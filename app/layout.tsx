import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { BottomNav } from "./_components/BottomNav";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "SparkNourish",
  title: "SparkNourish",
  description: "Track your meals and daily nutrition.",
  authors: [{ name: "Sparkwell Creative" }],
  publisher: "Sparkwell Creative",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-sand-100 font-sans text-forest-900 antialiased">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <div className="flex-1">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
