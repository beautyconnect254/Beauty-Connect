import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { VisitTracker } from "@/components/analytics/visit-tracker";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Beauty Connect",
    template: "%s | Beauty Connect",
  },
  description:
    "Salon staffing for beauty businesses hiring verified workers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AuthProvider>
          {children}
          <VisitTracker />
        </AuthProvider>
      </body>
    </html>
  );
}
