import Home from "./components/Home";

export default function HomePage() {
  return (
    <div className="font-sans items-start justify-items-start min-h-screen p-8 pb-20 gap-16">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Home />
      </main>
    </div>
  );
}
