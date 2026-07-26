import type { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "すきまっぷ", template: "%s | すきまっぷ" },
  description: "みんなの空き時間を指で塗って、重なる時間を見つける日程調整アプリ",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#047857", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body><Header /><main>{children}</main></body></html>;
}
