import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Production Intelligence — Global Film & TV Intelligence Platform",
  description:
    "Global intelligence platform for film, television and audiovisual production companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}
