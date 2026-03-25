"use client";

import { usePathname } from "next/navigation";
import Navbar from "../Navbar";
import MobileBottomNav from "../ui/MobileBottomNav";

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
      {showNavbar && <Navbar />}
      <div className={showNavbar ? "pt-16" : ""}>{children}</div>
      <MobileBottomNav />
    </div>
  );
}

export default CheckIfLogin;
