"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../components/ui/Logo";

function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Logo />
        </div>
        <button
          onClick={() => router.push("/register")}
          className="text-gray-300 hover:text-white transition-colors cursor-pointer rounded-lg border border-white/10 p-2"
        >
          Sign Up
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-center mb-8">
            Log in to Community
          </h1>

          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/10 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
              />
            </div>

            {/* Continue with Email Button */}
            <button className="w-full py-3 bg-white text-black rounded-md font-medium hover:bg-gray-100 transition-colors">
              Continue with Email
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <button className="w-full py-3 bg-black/10 border border-gray-700 rounded-md flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button className="w-full py-3 bg-black/10 border border-gray-700 rounded-md flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors relative">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
                <span className="absolute right-4 top-2 text-xs text-blue-400">
                  Last Used
                </span>
              </button>

              <button className="w-full py-3 bg-black/10 border border-gray-700 rounded-md flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span>Continue with SAML SSO</span>
              </button>

              <button className="w-full py-3 bg-black/10 border border-gray-700 rounded-md flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Continue with Passkey</span>
              </button>
            </div>

            {/* Show other options */}
            <button className="w-full py-3 text-gray-400 hover:text-white transition-colors">
              Show other options
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center mt-8">
            <span className="text-gray-400">Don&apos;t have an account? </span>
            <button
              onClick={() => router.push("/register")}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center space-x-6 p-6 text-sm text-gray-500">
        <button className="hover:text-gray-300 transition-colors">Terms</button>
        <button className="hover:text-gray-300 transition-colors">
          Privacy Policy
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
