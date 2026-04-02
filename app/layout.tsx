import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextFlow — LLM Workflow Builder",
  description:
    "Build, chain, and run AI tasks visually with NextFlow's node-based workflow editor.",
  keywords: ["AI", "LLM", "workflow", "automation", "Gemini", "no-code"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-sans antialiased bg-[#0a0a0f] text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
