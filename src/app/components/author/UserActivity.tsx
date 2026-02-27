import { FaRegNewspaper } from "react-icons/fa6";
import { MdOutlineInsertComment } from "react-icons/md";

function UserActivity() {
  return (
    <div className="bg-[#0a0a0a] w-full md:w-[25%] md:rounded-lg p-5 md:p-2 md:py-2 mt-3 flex md:flex-col gap-2 items-start justify-start">
      <div className="flex items-center gap-3 text-white text-lg md:text-2xl font-light">
        <FaRegNewspaper className="text-gray-400" />0 posts written
      </div>
      <div className="flex items-center gap-3 text-white text-lg md:text-2xl font-light">
        <MdOutlineInsertComment className="text-gray-400" />0 comments written
      </div>
    </div>
  );
}

export default UserActivity;
