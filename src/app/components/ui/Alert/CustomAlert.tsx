"use client";
import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { url: string; text?: string }) => void;
  type: "image" | "link";
  title: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
}) => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const handleConfirm = () => {
    if (!url.trim()) return;

    onConfirm({
      url: url.trim(),
      text: type === "link" ? text.trim() || url.trim() : undefined,
    });

    // Reset form
    setUrl("");
    setText("");
    onClose();
  };

  const handleCancel = () => {
    setUrl("");
    setText("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {type === "image" ? "Image URL" : "Link URL"}
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === "image"
                  ? "https://example.com/image.jpg"
                  : "https://example.com"
              }
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {type === "link" && (
            <div>
              <label
                htmlFor="text"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Link Text (optional)
              </label>
              <input
                id="text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter link text..."
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!url.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {type === "image" ? "Insert Image" : "Insert Link"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
