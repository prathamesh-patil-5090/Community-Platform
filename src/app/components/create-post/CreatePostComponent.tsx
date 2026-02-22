"use client";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FaImage, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import CustomAlert from "../ui/Alert/CustomAlert";
import DesktopMenuBar from "./DesktopMenuBar";
import MobileMenuBar from "./MobileMenuBar";
import "./styles.scss";

const extensions = [
  TextStyle,
  StarterKit,
  TiptapImage.configure({ inline: false, allowBase64: false }),
  TiptapLink.configure({ openOnClick: false }),
];

// ─── Tag input ────────────────────────────────────────────────────────────────

interface TagAndTitleInputProps {
  title: string;
  onTitleChange: (v: string) => void;
  tagInput: string;
  onTagInputChange: (v: string) => void;
  tags: string[];
  onRemoveTag: (tag: string) => void;
  postType: "Post" | "Article";
  onPostTypeChange: (v: "Post" | "Article") => void;
}

function TagAndTitleInput({
  title,
  onTitleChange,
  tagInput,
  onTagInputChange,
  tags,
  onRemoveTag,
  postType,
  onPostTypeChange,
}: TagAndTitleInputProps) {
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
      {/* Post type toggle */}
      <div className="flex border border-white/10 rounded-t-md overflow-hidden">
        {(["Post", "Article"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onPostTypeChange(type)}
            className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${
              postType === type
                ? "bg-white text-black"
                : "bg-[#0a0a0a] text-gray-400 hover:text-white"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        placeholder="New title here…"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        maxLength={300}
        className="h-15 bg-[#0a0a0a] border border-t-0 border-white/10 placeholder:pl-2 px-3
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

// ─── Cover image upload ───────────────────────────────────────────────────────

interface CoverImageUploadProps {
  coverImage: string | null;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

function CoverImageUpload({
  coverImage,
  isUploading,
  onFileSelect,
  onRemove,
}: CoverImageUploadProps) {
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

// ─── Main component ───────────────────────────────────────────────────────────

const CreatePostComponent = () => {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [postType, setPostType] = useState<"Post" | "Article">("Post");
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Upload / submit state
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isEditorImageUploading, setIsEditorImageUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert modal state
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: "image" | "link";
    title: string;
  }>({ isOpen: false, type: "image", title: "" });

  // Hidden file input for in-editor image upload
  const editorImageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: "",
  });

  // ── Restore quickpost draft from PostBar ────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const draft = sessionStorage.getItem("quickpost_draft");
    if (!draft) return;
    sessionStorage.removeItem("quickpost_draft");
    // Convert plain-text lines to TipTap paragraphs
    const html = draft
      .split("\n")
      .map((line) => `<p>${line.trim() === "" ? "<br>" : line}</p>`)
      .join("");
    editor.commands.setContent(html);
    // Move cursor to end
    editor.commands.focus("end");
  }, [editor]);

  // ── Tag management ──────────────────────────────────────────────────────────

  function handleTagInputChange(value: string) {
    if (value.startsWith("__ADD__:")) {
      const newTag = value.replace("__ADD__:", "").toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < 4) {
        setTags((prev) => [...prev, newTag]);
      }
      setTagInput("");
    } else {
      // Handle comma-separated paste
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

  // ── Image upload helper ─────────────────────────────────────────────────────

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

  // ── Cover image ─────────────────────────────────────────────────────────────

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

  // ── In-editor image (toolbar button → file picker → upload → insert) ────────

  function handleOpenAlert(type: "image" | "link") {
    if (type === "image") {
      // Trigger file picker instead of URL dialog
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

    // Only "link" type reaches here now (image uses file picker)
    editor
      .chain()
      .focus()
      .insertContent(
        `<a href="${data.url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">${data.text ?? data.url}</a>`,
      )
      .run();
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handlePublish() {
    if (!title.trim()) {
      toast.error("Please add a title before publishing.");
      return;
    }

    const content = editor?.getHTML() ?? "";
    if (!content || content === "<p></p>") {
      toast.error("Please write some content before publishing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          tags,
          coverImage: coverImage ?? undefined,
          postType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to publish. Please try again.");
        return;
      }

      toast.success("Post published successfully!");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mt-10 p-3 flex flex-col md:flex-row gap-6">
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
          postType={postType}
          onPostTypeChange={setPostType}
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

        {/* Publish / Save draft */}
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handlePublish}
            disabled={
              isSubmitting || isCoverUploading || isEditorImageUploading
            }
            className="px-6 py-2.5 bg-white text-black rounded-md font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
                Publishing…
              </>
            ) : (
              "Publish"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-1/2">
        <div className="rounded-md p-4">
          <h3 className="text-4xl font-extrabold text-white mb-4">
            Writing a Great Post Title – Extra Tips
          </h3>
          <ul className="text-gray-300 text-lg space-y-2 list-disc list-inside">
            <li>
              <strong>Keep it short &amp; punchy</strong> — Aim for 6–12 words.
            </li>
            <li>
              <strong>Clarity beats cleverness</strong> — Be clear about what
              the post is about.
            </li>
            <li>
              <strong>Use numbers or lists</strong> — e.g., &ldquo;5 Ways to
              Boost Your Community Engagement&rdquo;.
            </li>
            <li>
              <strong>Ask a question</strong> — e.g., &ldquo;Is Remote Work the
              Future of Tech?&rdquo;.
            </li>
            <li>
              <strong>Highlight benefits</strong> — Show the reader what
              they&apos;ll get.
            </li>
            <li>
              <strong>Use power words</strong> — proven, ultimate, easy,
              essential, guide, surprising.
            </li>
            <li>
              <strong>Include your keyword early</strong> — Helps SEO and
              searchability.
            </li>
            <li>
              <strong>Test variations</strong> — Try 2–3 versions before
              posting.
            </li>
          </ul>

          {/* Live preview card */}
          {title && (
            <div className="mt-8 p-4 border border-white/10 rounded-lg bg-[#111]">
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
              <span className="inline-block mt-2 text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                {postType}
              </span>
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
};

CreatePostComponent.displayName = "CreatePostComponent";
export default CreatePostComponent;
