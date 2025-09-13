import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";

interface ReportCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReport: () => void;
}

function ReportCommentModal({
  isOpen,
  onClose,
  onReport,
}: ReportCommentModalProps) {
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirmReport = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for reporting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API
      toast.success(
        "Successfully Reported. Appropriate action will be taken soon",
        {
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
        }
      );
      onReport();
      onClose();
    } catch {
      toast.error("Failed to report comment");
    } finally {
      setIsSubmitting(false);
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
            Report Comment
          </h2>
          <IoClose
            size={40}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors"
            onClick={handleCancel}
            aria-label="Close report modal"
          />
        </div>
        <p className="text-gray-300 mb-4 text-sm">
          Please provide a reason for reporting this comment (optional):
        </p>
        <textarea
          className="bg-gray-700 w-full p-2 mb-4 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          placeholder="e.g., Inappropriate content, spam..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex items-center justify-around py-4">
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
            onClick={handleConfirmReport}
            disabled={isSubmitting}
            aria-label="Confirm report"
          >
            {isSubmitting ? "Reporting..." : "Yes, Report"}
          </button>
          <button
            className="bg-black hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 cursor-pointer"
            onClick={handleCancel}
            aria-label="Cancel report"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportCommentModal;
