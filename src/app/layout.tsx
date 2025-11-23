import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chessr - Online Chess Game",
  description: "Play chess with bots or other people online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
