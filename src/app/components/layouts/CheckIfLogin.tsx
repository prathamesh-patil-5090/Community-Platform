"use client";

import { usePathname } from "next/navigation";
import Navbar from "../Navbar";

function CheckIfLogin({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathName = usePathname();
  const isAuthPage = pathName === "/login" || pathName === "/register";
  const isAdminPanel = pathName.startsWith("/admin-panel");
  const showNavbar = !isAuthPage && !isAdminPanel;

  return (
    <div className="min-h-screen">
      {showNavbar && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]">
          <Navbar />
        </div>
      )}
      <div className={showNavbar ? "pt-[60px]" : ""}>{children}</div>
    </div>
  );
}

export default CheckIfLogin;
