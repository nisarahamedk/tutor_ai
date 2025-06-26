import type { Metadata } from "next";
// Temporarily disable Google Fonts for build
// import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AccessibilityProvider, SkipToMainContent } from "@/components/shared/AccessibilityProvider";
import "./globals.css";

// const inter = Inter({ 
//   subsets: ["latin"],
//   display: 'swap',
//   fallback: ['system-ui', 'arial']
// });

export const metadata: Metadata = {
  title: "AI Tutor - Personalized Learning Platform",
  description: "Advanced AI-powered tutoring platform with personalized learning paths, real-time assistance, and comprehensive progress tracking.",
  keywords: "AI tutor, learning, education, personalized learning, online courses",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AccessibilityProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SkipToMainContent />
            
            <div className="min-h-screen bg-background font-sans antialiased">
              <main id="main-content" className="relative">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
