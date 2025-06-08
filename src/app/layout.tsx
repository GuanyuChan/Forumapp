
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Zenith Forums',
  description: 'A modern forum application.',
  // FAVICON GUIDELINES:
  // 1. CRITICAL: Ensure any 'src/app/favicon.ico.mjs' file is DELETED. This non-standard file causes build issues.
  // 2. Place a standard 'favicon.ico' (actual image file, NOT .mjs) in 'src/app/' OR 'public/'.
  // 3. By NOT specifying an 'icons' field in this metadata object, Next.js will automatically use the conventional favicon.ico.
  // 4. If build errors persist (like "Cannot read properties of null"), DELETE the .next folder and RESTART the dev server.
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
