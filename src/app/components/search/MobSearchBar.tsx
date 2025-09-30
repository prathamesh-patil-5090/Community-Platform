"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CiSearch } from "react-icons/ci";
function MobSearchBar() {
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
    <div className="w-[350]">
      <CiSearch
        className="absolute left-3 top-1/3 transform -translate-y-1/7 text-white"
        size={25}
      />
      <input
        placeholder="Find..."
        className={`text-white border w-[95%] border-white/10 bg-transparent rounded-md px-4 pl-10 py-2 placeholder:text-white/50`}
        onChange={handleChange}
        value={query}
        onKeyDown={enterQuery}
      ></input>
    </div>
  );
}

export default MobSearchBar;
