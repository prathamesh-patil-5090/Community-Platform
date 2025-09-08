import { CiSearch } from "react-icons/ci";

function SearchBar() {
  return (
    <div className="relative h-[50px]">
      <CiSearch
        className="absolute left-3 top-1/3 transform -translate-y-1/3 text-white"
        size={18}
      />
      <input
        placeholder="Your query"
        className={`text-white border border-white bg-black hover:bg-gray-700 rounded-md px-4 pl-10 py-2 w-2xl`}
      ></input>
      <p className="font-sans absolute right-3 top-1/3 transform -translate-y-1/3 text-gray-400">
        By P-Dev
      </p>
    </div>
  );
}

export default SearchBar;
