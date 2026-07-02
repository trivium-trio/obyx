import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";
import { DynamicProviderWrapper } from "@/components/providers/DynamicProviderWrapper";
import { LayoutShell } from "@/components/layout/LayoutShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OBYX — Cash to Code",
  description:
    "The fastest route between your cash and the crypto economy. Swap KSH to USDC in seconds with OBYX.",
  keywords: ["crypto", "fiat", "on-ramp", "off-ramp", "KSH", "USDC", "swap", "OBYX"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-surface-950 text-foreground">
        <AuthProvider>
          <DynamicProviderWrapper>
            <LayoutShell>{children}</LayoutShell>
          </DynamicProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
