import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";

interface ReportsComponentProps {
  postData: string;
  onClose: () => void;
}

export default function ReportsComponent({
  postData,
  onClose,
}: ReportsComponentProps) {
  const handleYes = () => {
    toast.success("Successfully Reported. Appropriate action will taken soon", {
      style: {
        fontSize: "0.85rem",
        padding: "10px 14px",
        borderRadius: "8px",
        maxWidth: "90vw",
        width: "auto",
        wordWrap: "break-word",
        lineHeight: "1.4",
      },
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    onClose();
  };

  const handleNo = () => {
    onClose();
  };

  return (
    <div className="grid grid-rows-1 rounded-lg bg-white max-w-[300px] md:max-w-[400px] md:min-h-72 px-2 mt-15 md:py-2 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="text-black font-sans font-bold text-2xl flex-wrap">
          Do you want to report this post - {postData}?
        </div>
        <IoClose size={24} className="cursor-pointer" onClick={onClose} />
      </div>
      <div className="flex items-center justify-around py-4">
        <button
          className="bg-red-500 rounded-lg text-white cursor-pointer p-4 hover:bg-gray-600"
          onClick={handleYes}
          aria-label="Confirm report"
        >
          Yes
        </button>
        <button
          className="bg-black rounded-lg text-white cursor-pointer p-4 hover:bg-gray-600"
          onClick={handleNo}
          aria-label="Cancel report"
        >
          No
        </button>
      </div>
    </div>
  );
}
