import type { Metadata } from "next";
import {
  DM_Sans,
  Geist,
  Geist_Mono,
  Poppins,
  Space_Grotesk,
} from "next/font/google";
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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
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
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={` ${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${dmSans.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <SessionProvider>
          <ToastContainer />
          <CheckIfLogin>{children}</CheckIfLogin>
        </SessionProvider>
      </body>
    </html>
  );
}
