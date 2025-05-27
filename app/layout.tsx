import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SelectedDateProvider } from "@/hooks/use-selected-date";
import { DataProvider } from "@/hooks/data-provider";
import { AISettingsProvider } from "@/hooks/use-ai-settings";
import { ChatSessionsProvider } from "@/hooks/use-chat-sessions";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
export const metadata: Metadata = {
  title: "Productivity Portal",
  description: "A minimalist productivity web app",
  generator: "v0.dev",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-oid="82rw9nz">
      <body className="bg-black text-white antialiased" data-oid="m:.xq:d">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          data-oid="wrkhxae"
        >
          <DataProvider>
            <AISettingsProvider>
              <ChatSessionsProvider>
                <SelectedDateProvider>
                  {children}
                  <Toaster data-oid="1ml1s.d" />
                </SelectedDateProvider>
              </ChatSessionsProvider>
            </AISettingsProvider>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
