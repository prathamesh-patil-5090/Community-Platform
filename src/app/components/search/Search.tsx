"use client";
import { useState } from "react";
import { useWindowSize } from "../hooks/useWindowSize";
import SearchSidebar from "./SearchSidebar";
import SearchDetails from "./SearchDetails";
import { useSearchParams } from "next/navigation";
import EmptySearch from "./EmptySearch";
import Button from "../ui/Button";

interface SearchProps {
  sortOptions: "Most Relevant" | "Newest" | "Oldest";
  setSortOptions: (option: "Most Relevant" | "Newest" | "Oldest") => void;
}

export default function Search({ sortOptions, setSortOptions }: SearchProps) {
  const { width } = useWindowSize();
  const [notiType, setNotiType] = useState<
    "posts" | "people" | "channels" | "tags" | "comments" | "my posts only"
  >("posts");
  const searchParams = useSearchParams();
  const params = searchParams?.get("q") || "";
  return (
    <div className="justify-center">
      {/* Mobile and Desktop Layout */}
      <div className="hidden md:flex flex-row items-center justify-between">
        <h1 className="hidden md:block flex-row gap-1 f ont-extrabold text-5xl p-2">
          Search Results {params && <span> - {params}</span>}
        </h1>
        {params && (
          <div className="flex flex-row gap-2 items-center">
            <Button
              name={"Most Relevant"}
              className={`${
                sortOptions === "Most Relevant" ? "bg-gray-700" : ""
              }`}
              onClick={() => setSortOptions("Most Relevant")}
            ></Button>
            <Button
              name={"Newest"}
              className={`${sortOptions === "Newest" ? "bg-gray-700" : ""}`}
              onClick={() => setSortOptions("Newest")}
            ></Button>
            <Button
              name={"Oldest"}
              className={`${sortOptions === "Oldest" ? "bg-gray-700" : ""}`}
              onClick={() => setSortOptions("Oldest")}
            ></Button>
          </div>
        )}
      </div>
      <div
        className={`flex ${
          width < 768 ? "flex-col gap-4" : "flex-row gap-8 p-5"
        } w-96 md:w-full `}
      >
        {/* Sidebar */}
        {params && (
          <div className={width < 768 ? "w-full" : "w-64 flex-shrink-0"}>
            <SearchSidebar setType={setNotiType} />
          </div>
        )}

        {/* Search Results */}
        {params ? (
          <div className="flex-1 min-w-0">
            <SearchDetails searchType={notiType} sortOptions={sortOptions} />
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 min-w-0">
            <EmptySearch />
          </div>
        )}
      </div>
    </div>
  );
}
