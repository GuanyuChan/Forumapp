
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Zenith Forums',
  description: 'A modern forum application.',
  // FAVICON GUIDELINES:
  // 1. URGENT & CRITICAL: Ensure any 'src/app/favicon.ico.mjs' file is PERMANENTLY DELETED. This non-standard file is the likely cause of persistent build errors.
  // 2. STANDARD FAVICON: Place a regular 'favicon.ico' (an actual image file, NOT .mjs) in 'src/app/' OR in the 'public/' directory.
  // 3. CONVENTIONAL METADATA: By NOT defining an 'icons' field in this metadata object, Next.js will automatically find and use a conventional 'favicon.ico'.
  // 4. RESOLVE PERSISTENT ERRORS: If "module factory not available", "Cannot read properties of null (reading 'use')", or similar build errors continue, you ABSOLUTELY MUST:
  //    a) DELETE the entire '.next' folder from your project root.
  //    b) Restart your dev server. This clears corrupted build cache.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col" suppressHydrationWarning={true}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
