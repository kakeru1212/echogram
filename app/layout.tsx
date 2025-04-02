import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/nextjs'
import { jaJP } from '@clerk/localizations'
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/nav/app-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Echogram",
  description: "SNS management tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

                
    <ClerkProvider localization={jaJP}>
      <html lang="ja">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

          <SignedIn>
            <main>
              <div className="[--header-height:calc(theme(spacing.14))]">
                <SidebarProvider className="flex flex-col">
                  <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset className="bg-neutral-100">
                      <AntdRegistry>{children}</AntdRegistry>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </div>
            </main>
          </SignedIn>

          <SignedOut>
            <main className="flex items-center justify-center min-h-screen">
              <SignIn routing="hash" />
            </main>
          </SignedOut>

        </body>
      </html>
    </ClerkProvider>
  );
}
