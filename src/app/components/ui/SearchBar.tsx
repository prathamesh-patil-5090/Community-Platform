"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function SearchBar() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams?.get("q") ?? "");
  const router = useRouter();

  // Sync input with URL query param changes (e.g. browser back/forward)
  useEffect(() => {
    const urlQuery = searchParams?.get("q") ?? "";
    setQuery(urlQuery);
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/search`);
    }
  };

  const enterQuery = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <input
      placeholder="Search architecture..."
      className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-white w-48 placeholder:text-slate-400"
      onChange={handleChange}
      value={query}
      onKeyDown={enterQuery}
    />
  );
}

export default SearchBar;
