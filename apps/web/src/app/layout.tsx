import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory — Orders & Products",
  description: "Orders and products inventory SPA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
