import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/components/Provider";


export const metadata: Metadata = {
  title: "Party MarketGame",
  description: "Party MarketGame",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en">
        <body>
          <div>
            <Providers>{children}</Providers>
          </div>
        </body>
      </html>
  );
}
