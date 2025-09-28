"use client";
import "./styles.scss";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useState } from "react";
import CustomAlert from "../ui/Alert/CustomAlert";
import DesktopMenuBar from "./DesktopMenuBar";
import MobileMenuBar from "./MobileMenuBar";

const extensions = [TextStyle, StarterKit];

function TagAndTitleInput() {
  return (
    <div className="flex flex-col">
      <input
        placeholder="New Title here..."
        className="h-15 bg-[#0a0a0a] border border-white/10 rounded-t-md placeholder:pl-2
             focus:outline-none focus:ring-0"
      />

      <input
        placeholder="Add upto 4 tags (comma seperated values)"
        className="h-12 bg-[#0a0a0a] border border-white/10 focus:outline-none focus:ring-0 placeholder:pl-2"
      />
    </div>
  );
}

const CreatePostComponent = () => {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: "image" | "link";
    title: string;
  }>({
    isOpen: false,
    type: "image",
    title: "",
  });

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: `
<h2>
  Hi there,
</h2>
<p>
  this is a <em>basic</em> example of <strong>Tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
</p>
<ul>
  <li>
    That’s a bullet list with one …
  </li>
  <li>
    … or two list items.
  </li>
</ul>
<p>
  Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
</p>
<blockquote>
  Wow, that’s amazing. Good work, boy! 👏
  <br />
  — Mom
</blockquote>
`,
  });

  const handleOpenAlert = (type: "image" | "link") => {
    setAlertState({
      isOpen: true,
      type,
      title: type === "image" ? "Insert Image" : "Insert Link",
    });
  };

  const handleCloseAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmAlert = (data: { url: string; text?: string }) => {
    if (!editor) return;

    if (alertState.type === "image") {
      editor
        .chain()
        .focus()
        .insertContent(
          `<img src="${data.url}" alt="Image" style="max-width: 100%; height: auto;" />`
        )
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${data.url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">${data.text}</a>`
        )
        .run();
    }
  };

  return (
    <div className="mt-10 p-3 flex flex-col md:flex-row gap-6">
      {/* Main Editor Section */}
      <div className="md:w-[60%]">
        <TagAndTitleInput />
        <div className="hidden md:block">
          <DesktopMenuBar editor={editor} onOpenAlert={handleOpenAlert} />
        </div>
        <div className="md:hidden">
          <MobileMenuBar editor={editor} onOpenAlert={handleOpenAlert} />
        </div>
        <EditorContent
          editor={editor}
          className="border border-white/10 border-t-0"
        />
      </div>

      {/* Desktop Sidebar with Writing Tips */}
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
              <strong>Use numbers or lists</strong> — e.g., “5 Ways to Boost
              Your Community Engagement”.
            </li>
            <li>
              <strong>Ask a question</strong> — e.g., “Is Remote Work the Future
              of Tech?”.
            </li>
            <li>
              <strong>Highlight benefits</strong> — Show the reader what they’ll
              get (e.g., “How to Double Your Reach with Better Titles”).
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
              <strong>Test variations</strong> — Try out 2–3 versions before
              posting.
            </li>
          </ul>
        </div>
      </div>

      {/* Custom Alert Modal */}
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

// Added: Set display name for React DevTools and ESLint compliance
CreatePostComponent.displayName = "CreatePostComponent";

export default CreatePostComponent;
