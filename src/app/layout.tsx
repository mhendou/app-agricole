import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { EnregistrerSW } from "@/components/PwaClient";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Oliveraie d'Afourer", template: "%s — Oliveraie d'Afourer" },
  description: "Dépenses, ventes d'huile, récoltes et pluie de l'oliveraie familiale d'Afourer.",
  applicationName: "Oliveraie d'Afourer",
  icons: { icon: "/icons/icone.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Afourer", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#3b4520", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {children}
        <EnregistrerSW />
      </body>
    </html>
  );
}
