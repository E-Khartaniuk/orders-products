import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "@/styles/globals.scss";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { StoreProvider } from "@/components/providers/StoreProvider";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-main",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Inventory",
    template: "%s · Inventory",
  },
  description: "Учёт приходов и продуктов",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={montserrat.variable}>
      <body>
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
