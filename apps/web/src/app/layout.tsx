import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "@/styles/globals.scss";
import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";
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
  description: "Orders & Products inventory",
  applicationName: "Inventory",
  appleWebApp: { capable: true, title: "Inventory", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#8bc34a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={montserrat.variable}>
      <body>
        <StoreProvider>{children}</StoreProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
