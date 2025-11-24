"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CiSearch } from "react-icons/ci";

function SearchBar() {
  const [query, setQuery] = useState<string>("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const enterQuery = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      router.push(`/search?q=${query}`);
    }
  };
  return (
    <div className="bg-black/30 rounded-lg relative">
      <CiSearch
        className="absolute left-3 top-1/3 transform -translate-y-1/3 text-white"
        size={18}
      />
      <input
        placeholder="Find..."
        className={`text-white border border-white/10 bg-transparent rounded-md px-4 pl-10 py-2 w-2xl placeholder:text-white/50`}
        onChange={handleChange}
        value={query}
        onKeyDown={enterQuery}
      ></input>
      <p className="font-dmSans absolute right-3 top-1/3 transform -translate-y-1/3 text-white/50">
        By P-Dev
      </p>
    </div>
  );
}

export default SearchBar;
