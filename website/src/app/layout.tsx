import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HealthStatus from "@/components/HealthStatus";
import { ThemeProvider } from '@/components/providers/ThemeContext';
import { AuthProvider } from '@/components/providers/AuthContext';
import { TenantAuthProvider } from '@/components/providers/TenantAuthContext';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Fiber Route Map",
  description: "Fiber Route Map management system — secure authentication and network management.",
  icons: {
    icon: "/assets/app/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <TenantAuthProvider>
              <Toaster position="bottom-right" richColors closeButton duration={3000} />
              <HealthStatus />
              {children}
            </TenantAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
