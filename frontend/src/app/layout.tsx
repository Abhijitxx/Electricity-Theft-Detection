import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { SystemProvider } from "@/context/SystemContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ampere.ai - Intelligent Electricity Theft Detection",
  description: "AI-powered electricity theft detection using ensemble machine learning with 5 advanced models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SystemProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </SystemProvider>
      </body>
    </html>
  );
}
