"use client";

import { usePathname } from "next/navigation";
import Navbar from "../Navbar";

function CheckIfLogin({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathName = usePathname();
  const showNavbar = pathName !== "/login" && pathName !== "/register";

  return (
    <div className="min-h-screen">
      {showNavbar && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]">
          <Navbar />
        </div>
      )}
      <div className={showNavbar ? "pt-[60px]" : ""}>
        {children}
      </div>
    </div>
  );
}

export default CheckIfLogin;
