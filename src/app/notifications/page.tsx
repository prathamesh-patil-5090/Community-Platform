"use client";

import { Suspense } from "react";
import Notifications from "../components/Notifications";

function NotificationsContent() {
  return (
    <main
      role="main"
      className="w-full min-h-screen bg-black text-white flex flex-col items-center justify-start py-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-7xl">
        <header className="mb-6">
          <h1 className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
            Notifications
          </h1>
        </header>

        <section className="w-full">
          <div className="w-full bg-transparent rounded-md">
            <Notifications />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense>
      <NotificationsContent />
    </Suspense>
  );
}
