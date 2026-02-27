"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Logo from "../components/ui/Logo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const sessionError = searchParams.get("error");

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuthLogin(provider: "google" | "github") {
    setError(null);
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

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

          {/* Error / info banners */}
          {sessionError === "SessionExpired" && (
            <div className="mb-4 px-4 py-3 bg-yellow-900/40 border border-yellow-700 rounded-md text-yellow-300 text-sm text-center">
              Your session has expired. Please sign in again.
            </div>
          )}
          {sessionError === "AccessDenied" && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-sm">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <div className="space-y-1">
                  <p className="text-red-300 font-semibold">
                    Account suspended
                  </p>
                  <p className="text-red-400/80 leading-relaxed">
                    Your account has been suspended due to a violation of our
                    community guidelines. If you believe this is a mistake or
                    would like to appeal, please{" "}
                    <a
                      href="mailto:admin@community.com"
                      className="text-red-300 underline underline-offset-2 hover:text-red-200 transition-colors"
                    >
                      contact the admins
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-md text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-black/10 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-black/10 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors disabled:opacity-50 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Continue with Email Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white text-black rounded-md font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Continue with Email"
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-black text-gray-500 text-sm">or</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin("google")}
                disabled={isLoading}
                className="w-full py-3 bg-black/10 border border-gray-700 rounded-md flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
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

              <button
                type="button"
                onClick={() => handleOAuthLogin("github")}
                disabled={isLoading}
                className="w-full py-3 bg-black/10 border border-gray-700 rounded-md flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>
          </form>

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
