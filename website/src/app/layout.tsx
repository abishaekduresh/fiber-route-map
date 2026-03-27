import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HealthStatus from "@/components/HealthStatus";
import { ThemeProvider } from '@/components/providers/ThemeContext';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fiber Route Map — Control Center",
  description: "Fiber Route Map management system — secure authentication and network management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Toaster position="bottom-right" richColors closeButton duration={3000} />
          <HealthStatus />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
