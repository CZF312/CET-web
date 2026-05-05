import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CET-4 英语学习平台",
  description: "英语四级单词打卡与刷题系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
