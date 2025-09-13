import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";

interface DeleteCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export default function DeleteCommentModal({
  isOpen,
  onClose,
  onDelete,
}: DeleteCommentModalProps) {
  const handleConfirmDelete = async () => {
    try {
      await onDelete();
      toast.success("Comment deleted successfully", {
        style: {
          fontSize: "0.85rem",
          padding: "10px 14px",
          borderRadius: "8px",
          maxWidth: "90vw",
          width: "auto",
          wordWrap: "break-word",
          backgroundColor: "#1f2937",
          color: "#ffffff",
          lineHeight: "1.4",
        },
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      onClose();
    } catch {
      toast.error("Failed to delete comment");
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center rounded-lg z-50 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg max-w-[300px] md:max-w-[400px] min-h-auto p-6 shadow-2xl border border-gray-600">
        <div className="flex justify-around items-center mb-4">
          <h2 className="text-white font-sans font-bold text-xl md:text-2xl flex-wrap">
            Delete Comment
          </h2>
          <IoClose
            size={40}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors"
            onClick={handleCancel}
            aria-label="Close delete modal"
          />
        </div>
        <p className="text-gray-300 mb-4 text-sm">
          Are you sure you want to delete this comment?
        </p>
        <div className="flex items-center justify-around py-4">
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 cursor-pointer"
            onClick={handleConfirmDelete}
            aria-label="Confirm delete"
          >
            Yes, Delete
          </button>
          <button
            className="bg-black hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 cursor-pointer"
            onClick={handleCancel}
            aria-label="Cancel delete"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
