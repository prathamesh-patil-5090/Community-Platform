import React from "react";
import { LuPencil } from "react-icons/lu";
import { MdDelete, MdOutlineReport } from "react-icons/md";

function CommentOptionsModal() {
  return (
    <div className="bg-white text-black rounded-lg min-w-[120px]">
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer">
        <LuPencil size={28} />
        <span>Edit</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer">
        <MdDelete size={28} />
        <span>Delete</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500">
        <MdOutlineReport size={28} />
        <span>Report</span>
      </div>
    </div>
  );
}

export default CommentOptionsModal;
