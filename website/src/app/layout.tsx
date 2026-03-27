import type { Metadata } from "next";
import "./globals.css";
import HealthStatus from "@/components/HealthStatus";

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
      <body>
        <HealthStatus />
        {children}
      </body>
    </html>
  );
}
