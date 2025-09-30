import React from "react";

function EmptySearch() {
  return (
    <div className="w-[80%] md:w-[700px] h-[300px] md:h-[200px] flex items-center justify-center rounded-lg border border-white/10 p-3 font-sans my-3 bg-[#0A0A0A]">
      <span className="font-extrabold text-3xl md:text-5xl flex items-center justify-center">
        Make a Search!
      </span>
    </div>
  );
}

export default EmptySearch;
