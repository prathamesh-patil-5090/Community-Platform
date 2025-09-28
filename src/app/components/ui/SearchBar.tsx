import { CiSearch } from "react-icons/ci";

function SearchBar() {
  return (
    <div className="relative h-[50px]">
      <CiSearch
        className="absolute left-3 top-1/3 transform -translate-y-1/3 text-white"
        size={18}
      />
      <input
        placeholder="Find..."
        className={`text-white border border-white/10 bg-transparent rounded-md px-4 pl-10 py-2 w-2xl placeholder:text-white/50`}
      ></input>
      <p className="font-dmSans absolute right-3 top-1/3 transform -translate-y-1/3 text-white/50">
        By P-Dev
      </p>
    </div>
  );
}

export default SearchBar;
