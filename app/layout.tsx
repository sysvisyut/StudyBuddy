import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Provider from "./provider";
import Aurora from "./_components/Aurora";

export const metadata: Metadata = {
  title: "Study Buddy",
  description: "Your personalized study assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className="antialiased relative min-h-screen"
        >
          <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
            <Aurora
              colorStops={["#7cff67", "#B19EEF", "#5227FF"]}
              blend={0.5}
              amplitude={1.0}
              speed={1}
            />
          </div>
          <Provider>
            <div className="relative z-10">
              {children}
            </div>
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
