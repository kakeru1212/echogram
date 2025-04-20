import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/nav/app-sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Echogram",
  description: "SNS management tools",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <UserProvider>
          <main className="min-h-screen">
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
        </UserProvider>
      </body>
    </html>
  );
}
