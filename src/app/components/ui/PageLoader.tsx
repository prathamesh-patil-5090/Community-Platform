"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";

const PageLoader = () => {
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const cookies = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("isPageLoadedAlready="));
      if (cookies && cookies.split("=")[1] === "true") {
        return false;
      }
    }
    return true;
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            document.cookie = "isPageLoadedAlready=true; path=/";
          }, 300);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        document.cookie = "isPageLoadedAlready=true; path=/";
      }, 300);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      document.cookie =
        "isPageLoadedAlready=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8 animate-bounce">
          <div className="flex items-center justify-center mb-4">
            <Logo logoClassName="text-5xl" />
          </div>
        </div>

        {/* Loading animation */}
        <div className="mb-6">
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-white font-dmSans font-medium">
          <div className="flex items-center justify-center gap-2">
            <span>Welcome to our community platform...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
