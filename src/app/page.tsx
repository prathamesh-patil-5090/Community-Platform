import Home from "./components/Home";
import PageLoader from "./components/ui/PageLoader";

export default function HomePage() {
  return (
    <div>
      <main>
        <PageLoader />
        <Home />
      </main>
    </div>
  );
}
