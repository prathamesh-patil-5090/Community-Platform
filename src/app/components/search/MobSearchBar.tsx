"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CiSearch } from "react-icons/ci";

function MobSearchBar() {
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
    <div className="w-[350] relative">
      <CiSearch
        className="absolute left-3 top-1/3 transform -translate-y-1/7 text-white cursor-pointer"
        size={25}
        onClick={handleSearch}
      />
      <input
        placeholder="Find..."
        className="text-white border w-[95%] border-white/10 bg-transparent rounded-md px-4 pl-10 py-2 placeholder:text-white/50"
        onChange={handleChange}
        value={query}
        onKeyDown={enterQuery}
      />
    </div>
  );
}

export default MobSearchBar;
