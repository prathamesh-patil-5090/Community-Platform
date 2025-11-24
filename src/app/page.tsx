import Home from "./components/Home";
import PageLoader from "./components/ui/PageLoader";

export default function HomePage() {
  return (
    <div className="">
      <main className="py-3">
        <PageLoader />
        <Home />
      </main>
    </div>
  );
}
