"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaImage, FaTimes } from "react-icons/fa";
import {
  IoAlertCircleOutline,
  IoArrowBack,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoEyeOutline,
  IoLayersOutline,
  IoReloadOutline,
  IoSaveOutline,
} from "react-icons/io5";
import { CraftBuilder, craftStateRef } from "../../../../components/craft";
import "../../../../components/create-post/styles.scss";

interface CommunityPageData {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  content: string;
  craftData?: string;
  coverImage: string | null;
  isActive: boolean;
  order: number;
  createdBy: string;
  createdByName: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
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

/* ─── Main Edit Community Page ─────────────────────────────────────────────── */

export default function EditCommunityPagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;

  /* ── Page data state ─────────────────────────────────────────────────────── */
  const [pageData, setPageData] = useState<CommunityPageData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /* ── Form state ──────────────────────────────────────────────────────────── */
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
  const [craftData, setCraftData] = useState("{}");

  // Toast
  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (toastState) {
      const timer = setTimeout(() => setToastState(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastState]);

  /* ── Auth guard ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  /* ── Fetch page ──────────────────────────────────────────────────────────── */
  /* ── Fetch existing page data ────────────────────────────────────────────── */
  useEffect(() => {
    if (status !== "authenticated" || !pageId) return;

    let cancelled = false;

    async function fetchPage() {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/admin/community-pages/${pageId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to load community page");
        }
        const data = await res.json();
        const p: CommunityPageData = data.page;

        if (!cancelled) {
          setPageData(p);
          setName(p.name);
          setSlug(p.slug);
          setIcon(p.icon);
          setDescription(p.description);
          setCoverImage(p.coverImage);
          setIsActive(p.isActive);
          setOrder(p.order);
          if (p.craftData) {
            setCraftData(p.craftData);
            craftStateRef.current = p.craftData;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err instanceof Error ? err.message : "Failed to load page",
          );
        }
      } finally {
        if (!cancelled) {
          setFetchLoading(false);
        }
      }
    }

    fetchPage();

    return () => {
      cancelled = true;
    };
  }, [status, pageId]);

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
      setToastState({ message: "Failed to upload cover image", type: "error" });
    } finally {
      setIsUploading(false);
    }
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

  /* ── Submit update ───────────────────────────────────────────────────────── */
  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setToastState({ message: validationError, type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/community-pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          icon: icon.trim(),
          description: description.trim(),
          content: "", // Deprecated, replaced by craftData
          craftData: craftStateRef.current,
          coverImage: coverImage || null,
          isActive,
          order,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to update community page");
      }

      setToastState({
        message: "Community page updated successfully!",
        type: "success",
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push("/admin-panel/community-pages");
      }, 1200);
    } catch (err) {
      setToastState({
        message:
          err instanceof Error
            ? err.message
            : "Failed to update community page",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Loading state ───────────────────────────────────────────────────────── */
  if (status === "loading" || fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading community page...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ─────────────────────────────────────────────────────────── */
  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <IoAlertCircleOutline size={48} className="text-red-400" />
          <div>
            <h3 className="text-white font-semibold text-lg">
              Failed to load community page
            </h3>
            <p className="text-gray-400 text-sm mt-1">{fetchError}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/admin-panel/community-pages")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <IoArrowBack size={16} />
              Back to List
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/20 text-sm text-purple-300 hover:bg-purple-600/30 transition-colors cursor-pointer"
            >
              <IoReloadOutline size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pageData) return null;

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
    <>
      <div className="flex lg:hidden items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-xl font-bold text-white">
          Please open this page in your Desktop or Laptop
        </h2>
      </div>
      <div className="hidden lg:block w-full">
      <div className="space-y-6 w-full">
      {/* Toast */}
      {toastState && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-sm transition-all ${
            toastState.type === "success"
              ? "bg-green-600/20 border-green-500/30 text-green-300"
              : "bg-red-600/20 border-red-500/30 text-red-300"
          }`}
        >
          {toastState.type === "success" ? (
            <IoCheckmarkCircleOutline size={20} />
          ) : (
            <IoAlertCircleOutline size={20} />
          )}
          <span className="text-sm font-medium">{toastState.message}</span>
          <button
            onClick={() => setToastState(null)}
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
            Edit Community Page
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Editing{" "}
            <span className="text-purple-400 font-medium">{pageData.name}</span>{" "}
            <span className="text-gray-500 font-mono text-xs">
              (/{pageData.slug})
            </span>
          </p>
        </div>
      </div>

      {/* Meta info bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 px-1">
        {pageData.createdByName && (
          <span>
            Created by{" "}
            <span className="text-gray-400">{pageData.createdByName}</span> on{" "}
            {new Date(pageData.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
        {pageData.updatedByName && (
          <>
            <span className="text-white/10">|</span>
            <span>
              Last updated by{" "}
              <span className="text-gray-400">{pageData.updatedByName}</span> on{" "}
              {new Date(pageData.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Top Info Row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Name */}
          <div className="lg:col-span-1">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
              Page Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tech Talk"
              maxLength={100}
              className="w-full h-[50px] px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-base font-semibold placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Slug */}
          <div className="lg:col-span-1">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
              URL Slug *
            </label>
            <div className="flex items-center gap-0 h-[50px]">
              <span className="px-3 py-3 rounded-l-lg bg-white/10 border border-r-0 border-white/10 text-gray-500 text-sm h-full flex items-center">
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
                className="flex-1 px-3 py-3 rounded-r-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors h-full"
              />
            </div>
            <div className="min-h-[20px] mt-1">
              {slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? (
                <p className="text-red-400 text-xs">
                  Lowercase letters, numbers, hyphens only
                </p>
              ) : !slugManuallyEdited && slug ? (
                <p className="text-gray-600 text-xs">
                  Auto-generated from name
                </p>
              ) : null}
            </div>
          </div>

          {/* Icon */}
          <div className="lg:col-span-1">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
              Icon (Emoji) *
            </label>
            <div className="flex gap-2 h-[50px]">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={10}
                className="w-16 px-2 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-xl text-center outline-none focus:border-purple-500/50 transition-colors h-full"
              />
              <div className="flex-1 flex items-center overflow-x-auto gap-1.5 scrollbar-hide px-2 border border-white/10 rounded-lg bg-white/[0.02]">
                {commonEmojis.slice(0, 15).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-lg hover:bg-white/10 transition-colors cursor-pointer ${
                      icon === emoji
                        ? "bg-purple-600/20 border border-purple-500/30"
                        : "bg-transparent border border-transparent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6 flex flex-col">
            {/* Description */}
            <div className="flex-1 flex flex-col">
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
                className="w-full flex-1 min-h-[100px] px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
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
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between h-full pt-6">
                <div>
                  <p className="text-white text-sm font-medium">
                    Active Status
                  </p>
                  <p className="text-gray-500 text-xs hidden sm:block">
                    Show in sidebar & URL
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
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
          </div>

          {/* Cover Image */}
          <div>
            <CoverImageUpload
              coverImage={coverImage}
              isUploading={isUploading}
              onFileSelect={handleCoverUpload}
              onRemove={() => setCoverImage(null)}
            />
          </div>
        </div>

        {/* ── Actions Row ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{icon || "📄"}</span>
            <div>
              <p className="text-white font-medium">{name || "Untitled"}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 font-mono">
                  /{slug || "slug"}
                </span>
                <span className="text-gray-600">•</span>
                <span
                  className={`${isActive ? "text-green-400" : "text-gray-400"}`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <IoEyeOutline size={16} />
              {showPreview ? "Hide Preview" : "Preview"}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <IoSaveOutline size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Craft.js Page Builder (Full Width) ────────────────────────────── */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden p-2 mt-6">
        <CraftBuilder
          initialData={craftData}
          onSave={(data) => {
            setCraftData(data);
            setToastState({
              message: "Layout saved to memory. Don't forget to Save Changes.",
              type: "success",
            });
          }}
        />
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

            {/* Content Preview */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
              <p className="text-gray-400 text-sm mb-2">
                Page layout built with Craft.js builder.
              </p>
              <p className="text-gray-500 text-xs">
                To see the full rendered structure, view the live page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
}
