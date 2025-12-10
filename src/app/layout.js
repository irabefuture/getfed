import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import AppErrorBoundary from "@/components/AppErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Getfed",
  description: "Plan meals, get fed",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Getfed",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

// Separate viewport export for themeColor (Next.js 16 requirement)
export const viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <AppErrorBoundary>
            {children}
          </AppErrorBoundary>
        </UserProvider>
      </body>
    </html>
  );
}