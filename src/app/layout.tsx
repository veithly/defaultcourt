import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://defaultcourt.pages.dev"),
  title: "DefaultCourt",
  description: "Portaldot default resolution room for RWA credit operators.",
  openGraph: {
    title: "DefaultCourt",
    description: "Turn missed covenants into Portaldot-recorded recovery receipts.",
    images: ["/brand/og.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
