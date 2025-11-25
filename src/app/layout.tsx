import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Goat",
  description: "An AI is building this app. One feature per day. December 2024.",
  openGraph: {
    title: "The Goat",
    description: "An AI is building this app. One feature per day.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Goat",
    description: "An AI is building this app. One feature per day.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="crt-overlay" />
        {children}
      </body>
    </html>
  );
}
