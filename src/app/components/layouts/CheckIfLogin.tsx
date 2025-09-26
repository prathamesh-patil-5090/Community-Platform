"use client";

import { usePathname } from "next/navigation";
import Navbar from "../Navbar";

function CheckIfLogin({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathName = usePathname();

  return (
    <div>
      {pathName !== "/login" && pathName !== "/register" && <Navbar />}
      {children}
    </div>
  );
}

export default CheckIfLogin;
