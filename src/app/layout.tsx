import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono, Poppins } from "next/font/google";
import { ToastContainer } from "react-toastify";
import CheckIfLogin from "./components/layouts/CheckIfLogin";
import SessionProvider from "./components/providers/SessionProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmSans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Community Platform",
  description: "An open-sourced community platform ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${dmSans.variable} antialiased`}
      >
        <SessionProvider>
          <ToastContainer />
          <CheckIfLogin>{children}</CheckIfLogin>
        </SessionProvider>
      </body>
    </html>
  );
}
