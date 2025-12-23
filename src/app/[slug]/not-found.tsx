import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Community Not Found
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-md mx-auto">
          The community you are looking for does not exist. Please check the
          sidebar for available communities.
        </p>
        <Link
          href="/"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-medium px-8 py-3 rounded-md transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
