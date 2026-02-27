"use client";

import { Image as TiptapImage } from "@tiptap/extension-image";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaImage, FaTimes } from "react-icons/fa";
import { IoAlertCircleOutline, IoReloadOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import DesktopMenuBar from "../../../../components/create-post/DesktopMenuBar";
import MobileMenuBar from "../../../../components/create-post/MobileMenuBar";
import "../../../../components/create-post/styles.scss";
import CustomAlert from "../../../../components/ui/Alert/CustomAlert";

const extensions = [
  TextStyle,
  StarterKit,
  TiptapImage.configure({ inline: false, allowBase64: false }),
  TiptapLink.configure({ openOnClick: false }),
];

interface AdData {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  linkUrl: string | null;
  placement: "sidebar" | "feed" | "banner";
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  tags: string[];
  createdBy: string;
  createdByName: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

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

/* ─── Tag & Title Input ───────────────────────────────────────────────────── */

function TagAndTitleInput({
  title,
  onTitleChange,
  tagInput,
  onTagInputChange,
  tags,
  onRemoveTag,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  tagInput: string;
  onTagInputChange: (v: string) => void;
  tags: string[];
  onRemoveTag: (tag: string) => void;
}) {
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const raw = tagInput.trim().replace(/^,+|,+$/g, "");
      if (raw && tags.length < 4) {
        onTagInputChange("__ADD__:" + raw);
      }
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Title */}
      <input
        placeholder="Ad title here…"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        maxLength={300}
        className="h-15 bg-[#0a0a0a] border border-white/10 rounded-t-md placeholder:pl-2 px-3
             text-white text-xl font-semibold focus:outline-none focus:ring-0"
      />

      {/* Tags */}
      <div className="min-h-[48px] bg-[#0a0a0a] border border-t-0 border-white/10 flex flex-wrap items-center gap-2 px-3 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-white/10 text-white text-xs px-2 py-1 rounded-full"
          >
            #{tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="hover:text-red-400 transition-colors cursor-pointer"
            >
              <FaTimes size={10} />
            </button>
          </span>
        ))}
        {tags.length < 4 && (
          <input
            placeholder={
              tags.length === 0
                ? "Add up to 4 tags (press , or Enter)"
                : "Add tag…"
            }
            value={tagInput.startsWith("__ADD__:") ? "" : tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="flex-1 min-w-[180px] bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

/* ─── Helper: convert ISO date to datetime-local value ────────────────────── */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    // Format: YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/* ─── Main Edit Ad Page ───────────────────────────────────────────────────── */

export default function EditAdPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const adId = typeof params.id === "string" ? params.id : "";

  // Loading states
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState<"sidebar" | "feed" | "banner">(
    "sidebar",
  );
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Original data for comparison
  const [originalAd, setOriginalAd] = useState<AdData | null>(null);

  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isEditorImageUploading, setIsEditorImageUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: "image" | "link";
    title: string;
  }>({ isOpen: false, type: "image", title: "" });

  const editorImageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: "",
    onUpdate: () => {
      // mark as ready on first real update
      if (!editorReady) setEditorReady(true);
    },
  });

  // Fetch existing ad data
  const fetchAd = useCallback(async () => {
    if (!adId) return;
    setFetchLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/ads/${adId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to fetch ad");
      }
      const data = await res.json();
      const ad: AdData = data.ad;
      setOriginalAd(ad);

      // Populate form fields
      setTitle(ad.title);
      setTags(ad.tags ?? []);
      setCoverImage(ad.coverImage);
      setLinkUrl(ad.linkUrl ?? "");
      setPlacement(ad.placement);
      setIsActive(ad.isActive);
      setPriority(ad.priority);
      setStartDate(toDatetimeLocal(ad.startDate));
      setEndDate(toDatetimeLocal(ad.endDate));

      // Set editor content
      if (editor) {
        editor.commands.setContent(ad.content ?? "");
      }
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setFetchLoading(false);
    }
  }, [adId, editor]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/");
      return;
    }
    if (editor) {
      fetchAd();
    }
  }, [session, status, router, editor, fetchAd]);

  function handleTagInputChange(value: string) {
    if (value.startsWith("__ADD__:")) {
      const newTag = value.replace("__ADD__:", "").toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < 4) {
        setTags((prev) => [...prev, newTag]);
      }
      setTagInput("");
    } else {
      if (value.includes(",")) {
        const parts = value
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0);
        const newTags = [...tags];
        for (const part of parts) {
          if (!newTags.includes(part) && newTags.length < 4) {
            newTags.push(part);
          }
        }
        setTags(newTags);
        setTagInput("");
      } else {
        setTagInput(value);
      }
    }
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

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

    return data.url as string;
  }

  async function handleCoverImageSelect(file: File) {
    setIsCoverUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setCoverImage(url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Cover image upload failed.",
      );
    } finally {
      setIsCoverUploading(false);
    }
  }

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
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Editor image upload failed.",
      );
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
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Please add a title before saving.");
      return;
    }

    const content = editor?.getHTML() ?? "";
    if (!content || content === "<p></p>") {
      toast.error("Please write some content before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          title: title.trim(),
          content,
          tags,
          coverImage: coverImage ?? null,
          linkUrl: linkUrl.trim() || null,
          placement,
          isActive,
          priority,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update ad. Please try again.");
        return;
      }

      toast.success("Ad updated successfully!");
      router.push("/admin-panel/ads");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading
  if (status === "loading" || fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading ad...</p>
        </div>
      </div>
    );
  }

  // Error
  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <IoAlertCircleOutline size={48} className="text-red-400" />
          <div>
            <h3 className="text-white font-semibold text-lg">
              Failed to load ad
            </h3>
            <p className="text-gray-400 text-sm mt-1">{fetchError}</p>
          </div>
          <button
            onClick={fetchAd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <IoReloadOutline size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col md:flex-row gap-6">
      {/* Hidden file input for in-editor image uploads */}
      <input
        ref={editorImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleEditorImageFileSelect}
      />

      {/* Main Editor Section */}
      <div className="md:w-[60%]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Ad</h2>
            {originalAd && (
              <p className="text-gray-500 text-xs mt-0.5 font-mono">
                {originalAd.id}
              </p>
            )}
          </div>
          {originalAd?.updatedByName && (
            <p className="text-gray-500 text-xs">
              Last edited by{" "}
              <span className="text-gray-300">{originalAd.updatedByName}</span>
            </p>
          )}
        </div>

        {/* Cover image */}
        <CoverImageUpload
          coverImage={coverImage}
          isUploading={isCoverUploading}
          onFileSelect={handleCoverImageSelect}
          onRemove={() => setCoverImage(null)}
        />

        {/* Title + Tags */}
        <TagAndTitleInput
          title={title}
          onTitleChange={setTitle}
          tagInput={tagInput}
          onTagInputChange={handleTagInputChange}
          tags={tags}
          onRemoveTag={handleRemoveTag}
        />

        {/* Toolbar */}
        <div className="hidden md:block">
          <DesktopMenuBar editor={editor} onOpenAlert={handleOpenAlert} />
        </div>
        <div className="md:hidden">
          <MobileMenuBar editor={editor} onOpenAlert={handleOpenAlert} />
        </div>

        {/* Editor uploading indicator */}
        {isEditorImageUploading && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 border border-blue-700/40 text-blue-300 text-xs rounded-b-none border-t-0">
            <svg
              className="animate-spin h-3 w-3"
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
            Uploading image to Cloudinary…
          </div>
        )}

        {/* TipTap editor */}
        <EditorContent
          editor={editor}
          className="border border-white/10 border-t-0 min-h-[300px]"
        />

        {/* Save / Cancel */}
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={
              isSubmitting || isCoverUploading || isEditorImageUploading
            }
            className="px-6 py-2.5 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
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
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin-panel/ads")}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Sidebar — Ad Settings */}
      <div className="md:w-[40%]">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-6 sticky top-6">
          <h3 className="text-lg font-semibold text-white">Ad Settings</h3>

          {/* Stats (read-only) */}
          {originalAd && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                  Impressions
                </p>
                <p className="text-gray-300 text-sm font-medium">
                  {originalAd.impressions.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                  Clicks
                </p>
                <p className="text-gray-300 text-sm font-medium">
                  {originalAd.clicks.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                  CTR
                </p>
                <p className="text-gray-300 text-sm font-medium">
                  {originalAd.impressions > 0
                    ? (
                        (originalAd.clicks / originalAd.impressions) *
                        100
                      ).toFixed(2) + "%"
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                  Created By
                </p>
                <p className="text-gray-300 text-xs truncate">
                  {originalAd.createdByName ?? "Unknown"}
                </p>
              </div>
            </div>
          )}

          {/* Placement */}
          <div>
            <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
              Placement
            </label>
            <div className="flex border border-white/10 rounded-md overflow-hidden">
              {(["sidebar", "feed", "banner"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlacement(p)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer capitalize ${
                    placement === p
                      ? "bg-purple-600 text-white"
                      : "bg-[#0a0a0a] text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-1.5">
              {placement === "sidebar"
                ? "Shown in the right column of post pages."
                : placement === "feed"
                  ? "Shown between posts in the main feed."
                  : "Shown as a top banner across pages."}
            </p>
          </div>

          {/* Active Toggle */}
          <div>
            <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
              Status
            </label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                isActive
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-white/5 border-white/10 text-gray-400"
              }`}
            >
              <span className="text-sm font-medium">
                {isActive ? "Active" : "Inactive"}
              </span>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  isActive ? "bg-green-600" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    isActive ? "left-5" : "left-0.5"
                  }`}
                />
              </div>
            </button>
            <p className="text-gray-500 text-xs mt-1.5">
              Inactive ads won&apos;t be shown to users.
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
              Priority ({priority})
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Low (0)</span>
              <span>High (100)</span>
            </div>
            <p className="text-gray-500 text-xs mt-1.5">
              Higher priority ads are shown first.
            </p>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
              Link URL (optional)
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <p className="text-gray-500 text-xs mt-1.5">
              Where users go when they click the ad.
            </p>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
              Schedule (optional)
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-500 text-xs mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]"
                />
              </div>
              {startDate || endDate ? (
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 text-xs flex-1">
                    {startDate && endDate
                      ? `Showing from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
                      : startDate
                        ? `Starts ${new Date(startDate).toLocaleDateString()}`
                        : `Ends ${new Date(endDate).toLocaleDateString()}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">
                  Leave empty to show the ad indefinitely (while active).
                </p>
              )}
            </div>
          </div>

          {/* Live Preview Card */}
          {title && (
            <div className="mt-4 p-4 border border-white/10 rounded-lg bg-[#111]">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">
                Preview
              </p>
              {coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              <p className="text-white font-bold text-lg leading-snug">
                {title}
              </p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${
                    placement === "sidebar"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : placement === "feed"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }`}
                >
                  {placement}
                </span>
                <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                  Priority: {priority}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-green-500/10 text-green-400"
                      : "bg-gray-500/10 text-gray-400"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {linkUrl && (
                <p className="text-xs text-blue-400 mt-2 truncate">
                  → {linkUrl}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Link alert modal (image uses file picker, only link uses this) */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={handleCloseAlert}
        onConfirm={handleConfirmAlert}
        type={alertState.type}
        title={alertState.title}
      />
    </div>
  );
}
