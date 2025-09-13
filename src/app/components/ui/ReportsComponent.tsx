"use client";
import { useState } from "react";
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
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleYes = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Successfully Reported. Appropriate action will taken soon", {
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
    setIsSubmitting(false);
    onClose();
  };

  const handleNo = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black-70  flex justify-center items-center rounded-lg z-50 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg max-w-[300px] md:max-w-[400px] min-h-72 p-6 shadow-2xl border border-gray-600">
        <div className="flex justify-center items-center mb-4">
          <h2 className="text-white font-sans font-bold text-xl md:text-2xl flex-wrap">
            Do you want to report this post - {postData}?
          </h2>
          <IoClose
            size={70}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close report modal"
          />
        </div>
        <p className="text-gary-300 mb-4 text-sm">
          Please provide a reason fro reporting this post (optional):
        </p>
        <textarea
          className="bg-gray-700 w-full p-2 mb-4 rounded-lg text-white border border-gray-600 focuus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          placeholder="e.g., Inappropriate content, spam..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex items-center justify-around py-4">
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
            onClick={handleYes}
            disabled={isSubmitting}
            aria-label="Confirm report"
          >
            {isSubmitting ? "Reporting..." : "Yes, Report"}
          </button>
          <button
            className="bg-black hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 cursor-pointer
            "
            onClick={handleNo}
            aria-label="Cancel report"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
