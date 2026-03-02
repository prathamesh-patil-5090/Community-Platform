"use client";

import { Image as TiptapImage } from "@tiptap/extension-image";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FaImage, FaTimes } from "react-icons/fa";
import {
  IoAlertCircleOutline,
  IoArrowBack,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoEyeOutline,
  IoLayersOutline,
  IoSaveOutline,
} from "react-icons/io5";
import DesktopMenuBar from "../../../components/create-post/DesktopMenuBar";
import MobileMenuBar from "../../../components/create-post/MobileMenuBar";
import "../../../components/create-post/styles.scss";
import CustomAlert from "../../../components/ui/Alert/CustomAlert";

const extensions = [
  TextStyle,
  StarterKit,
  TiptapImage.configure({ inline: false, allowBase64: false }),
  TiptapLink.configure({ openOnClick: false }),
];

/* ─── Cover Image Upload ──────────────────────────────────────────────────── */

function CoverImageUpload({
  coverImage,
  isUploading,
  onFileSelect,
  onRemove,
}: {
  coverImage: string | null;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-3">
      {coverImage ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt="Cover"
            className="w-full max-h-60 object-cover rounded-md border border-white/10"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
          >
            <FaTimes size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-dashed border-white/20 hover:border-white/40 px-4 py-3 rounded-md transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isUploading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Uploading cover image…
            </>
          ) : (
            <>
              <FaImage size={14} />
              Add a cover image
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ─── Slug Helper ─────────────────────────────────────────────────────────── */

function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ─── Main Create Community Page ──────────────────────────────────────────── */

export default function CreateCommunityPagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [icon, setIcon] = useState("📄");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditorImageUploading, setIsEditorImageUploading] = useState(false);
  const editorImageInputRef = useRef<HTMLInputElement>(null);

  // Alert state for link insertion
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: "link" | "image";
    title: string;
  }>({ isOpen: false, type: "link", title: "" });

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /* ── Auth guard ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  /* ── TipTap editor ───────────────────────────────────────────────────────── */
  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[300px] px-4 py-3 focus:outline-none text-white",
      },
    },
  });

  /* ── Auto-generate slug from name ────────────────────────────────────────── */
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(nameToSlug(name));
    }
  }, [name, slugManuallyEdited]);

  /* ── Upload image to Cloudinary ──────────────────────────────────────────── */
  async function uploadImageToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Upload failed");
    }

    return (data.url ?? data.secure_url) as string;
  }

  /* ── Upload cover image ──────────────────────────────────────────────────── */
  async function handleCoverUpload(file: File) {
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setCoverImage(url);
    } catch {
      setToast({ message: "Failed to upload cover image", type: "error" });
    } finally {
      setIsUploading(false);
    }
  }

  /* ── Editor toolbar handlers ─────────────────────────────────────────────── */
  function handleOpenAlert(type: "image" | "link") {
    if (type === "image") {
      editorImageInputRef.current?.click();
    } else {
      setAlertState({ isOpen: true, type, title: "Insert Link" });
    }
  }

  async function handleEditorImageFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    setIsEditorImageUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      setToast({ message: "Editor image upload failed", type: "error" });
    } finally {
      setIsEditorImageUploading(false);
    }
  }

  function handleCloseAlert() {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }

  function handleConfirmAlert(data: { url: string; text?: string }) {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent(
        `<a href="${data.url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">${data.text ?? data.url}</a>`,
      )
      .run();

    handleCloseAlert();
  }

  /* ── Validate ────────────────────────────────────────────────────────────── */
  function validate(): string | null {
    if (!name.trim()) return "Page name is required.";
    if (!slug.trim()) return "Slug is required.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      return "Slug must be lowercase alphanumeric with hyphens only (e.g. 'tech-talk').";
    }
    const reserved = [
      "login",
      "register",
      "profile",
      "settings",
      "admin-panel",
      "create-post",
      "posts",
      "api",
      "search",
      "notifications",
    ];
    if (reserved.includes(slug.trim())) {
      return `The slug "${slug.trim()}" is reserved and cannot be used.`;
    }
    if (!icon.trim()) return "Icon (emoji) is required.";
    if (!description.trim()) return "Description is required.";
    if (description.trim().length > 500)
      return "Description cannot exceed 500 characters.";
    return null;
  }

  /* ── Submit ──────────────────────────────────────────────────────────────── */
  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setToast({ message: validationError, type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const content = editor?.getHTML() ?? "";

      const res = await fetch("/api/admin/community-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          icon: icon.trim(),
          description: description.trim(),
          content,
          coverImage: coverImage || undefined,
          isActive,
          order,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to create community page");
      }

      setToast({
        message: "Community page created successfully!",
        type: "success",
      });

      // Redirect after a short delay so the user sees the success message
      setTimeout(() => {
        router.push("/admin-panel/community-pages");
      }, 1200);
    } catch (err) {
      setToast({
        message:
          err instanceof Error
            ? err.message
            : "Failed to create community page",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  /* ── Common emoji picker options ─────────────────────────────────────────── */
  const commonEmojis = [
    "🏠",
    "🎙️",
    "🎮",
    "🎨",
    "📰",
    "👩🏻‍💻",
    "🎵",
    "⚽",
    "📚",
    "💪",
    "✈️",
    "🍳",
    "💡",
    "🔧",
    "🎯",
    "🌍",
    "💬",
    "📱",
    "🎬",
    "🔬",
    "🏆",
    "❤️",
    "🚀",
    "📄",
    "🎪",
    "🛒",
    "🎓",
    "🎭",
    "🌱",
    "🔥",
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-sm transition-all ${
            toast.type === "success"
              ? "bg-green-600/20 border-green-500/30 text-green-300"
              : "bg-red-600/20 border-red-500/30 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <IoCheckmarkCircleOutline size={20} />
          ) : (
            <IoAlertCircleOutline size={20} />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/40 hover:text-white/70 cursor-pointer"
          >
            <IoCloseOutline size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin-panel/community-pages")}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <IoArrowBack size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <IoLayersOutline size={28} className="text-purple-400" />
            Create Community Page
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Set up a new sidebar community page with custom content.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Main Editor ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
              Page Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tech Talk"
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-base font-semibold placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Cover Image */}
          <CoverImageUpload
            coverImage={coverImage}
            isUploading={isUploading}
            onFileSelect={handleCoverUpload}
            onRemove={() => setCoverImage(null)}
          />

          {/* TipTap Editor */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
            <div className="border-b border-white/10">
              {editor && (
                <>
                  <div className="hidden md:block">
                    <DesktopMenuBar
                      editor={editor}
                      onOpenAlert={handleOpenAlert}
                    />
                  </div>
                  <div className="md:hidden">
                    <MobileMenuBar
                      editor={editor}
                      onOpenAlert={handleOpenAlert}
                    />
                  </div>
                </>
              )}
            </div>
            {isEditorImageUploading && (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 border-b border-white/10 text-xs text-purple-300">
                <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                Uploading image…
              </div>
            )}
            <EditorContent editor={editor} />
          </div>

          {/* Hidden file input for editor images */}
          <input
            ref={editorImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleEditorImageFileSelect}
          />
        </div>

        {/* ── Right: Settings Panel ────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Slug */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-white font-semibold text-sm">Page Settings</h3>

            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
                URL Slug *
              </label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-2.5 rounded-l-lg bg-white/10 border border-r-0 border-white/10 text-gray-500 text-sm">
                  /
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    );
                  }}
                  placeholder="tech-talk"
                  maxLength={120}
                  className="flex-1 px-3 py-2.5 rounded-r-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
              {slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && (
                <p className="text-red-400 text-xs mt-1">
                  Slug must be lowercase letters, numbers, and hyphens only
                </p>
              )}
              {!slugManuallyEdited && slug && (
                <p className="text-gray-600 text-xs mt-1">
                  Auto-generated from name
                </p>
              )}
            </div>

            {/* Icon */}
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
                Icon (Emoji) *
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={10}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-2xl text-center outline-none focus:border-purple-500/50 transition-colors"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-lg hover:bg-white/10 transition-colors cursor-pointer ${
                      icon === emoji
                        ? "bg-purple-600/20 border border-purple-500/30"
                        : "bg-white/5 border border-transparent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
                Description *{" "}
                <span className="text-gray-600">
                  ({description.length}/500)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of this community page..."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors resize-none"
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
                Sidebar Order
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) =>
                  setOrder(Math.max(0, parseInt(e.target.value) || 0))
                }
                min={0}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-500/50 transition-colors"
              />
              <p className="text-gray-600 text-xs mt-1">
                Lower number = appears higher in sidebar
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-white text-sm font-medium">Active</p>
                <p className="text-gray-500 text-xs">
                  Show in sidebar and make URL accessible
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  isActive ? "bg-green-600" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm">Actions</h3>

            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <IoEyeOutline size={16} />
              {showPreview ? "Hide Preview" : "Preview Page"}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <IoSaveOutline size={16} />
                  Create Page
                </>
              )}
            </button>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl">{icon || "📄"}</span>
                <div>
                  <p className="text-white font-medium">{name || "Untitled"}</p>
                  <p className="text-gray-500 text-xs font-mono">
                    /{slug || "slug"}
                  </p>
                </div>
              </div>
              {description && (
                <p className="text-gray-400 text-xs line-clamp-2">
                  {description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-green-600/15 text-green-400"
                      : "bg-gray-600/15 text-gray-400"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-gray-500">Order: {order}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Preview Panel ──────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <IoEyeOutline size={18} className="text-purple-400" />
              Page Preview
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <IoCloseOutline size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Header preview */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-6xl">{icon || "📄"}</span>
                <h1 className="text-4xl font-bold text-white">
                  {name || "Untitled Page"}
                </h1>
              </div>
              <p className="text-xl text-gray-400 max-w-3xl">
                {description || "No description provided."}
              </p>
            </div>

            {/* Cover image */}
            {coverImage && (
              <div className="mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full max-h-64 object-cover rounded-lg border border-white/10"
                />
              </div>
            )}

            {/* Content */}
            {editor && editor.getHTML() !== "<p></p>" && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div
                  className="prose prose-invert max-w-none
                    [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0
                    [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl
                    [&_strong]:text-white [&_em]:text-gray-300 [&_a]:text-purple-400
                    [&_img]:rounded-lg [&_img]:max-w-full [&_blockquote]:border-l-purple-500"
                  dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                />
              </div>
            )}

            {/* Empty content placeholder */}
            {(!editor || editor.getHTML() === "<p></p>") && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">
                  Page content will appear here. Use the editor above to add
                  content.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link alert modal */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={handleCloseAlert}
        onConfirm={handleConfirmAlert}
        title={alertState.title}
        type={alertState.type}
      />
    </div>
  );
}
