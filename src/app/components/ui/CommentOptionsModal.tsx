"use client";
import React, { useState } from "react";
import { LuPencil } from "react-icons/lu";
import { MdDelete, MdOutlineReport } from "react-icons/md";
import { createPortal } from "react-dom";
import DeleteCommentModal from "./DeleteCommentModal";
import ReportCommentModal from "./ReportCommentModal";

interface CommentOptionsModalProps {
  onDelete: () => void;
  onReport: () => void;
}

function CommentOptionsModal({ onDelete, onReport }: CommentOptionsModalProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleDelete = () => setShowDeleteModal(true);
  const handleReport = () => setShowReportModal(true);

  return (
    <>
      <div className="bg-white text-black rounded-lg min-w-[120px]">
        <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 hover:rounded-t-lg cursor-pointer">
          <LuPencil size={28} />
          <span>Edit</span>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={handleDelete}
        >
          <MdDelete size={28} />
          <span>Delete</span>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 hover:rounded-b-lg cursor-pointer text-red-500"
          onClick={handleReport}
        >
          <MdOutlineReport size={28} />
          <span>Report</span>
        </div>
      </div>
      {showDeleteModal &&
        createPortal(
          <DeleteCommentModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDelete={onDelete}
          />,
          document.body
        )}
      {showReportModal &&
        createPortal(
          <ReportCommentModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            onReport={onReport}
          />,
          document.body
        )}
    </>
  );
}

export default CommentOptionsModal;
