"use client";

import { Editor, Frame } from "@craftjs/core";
import { CraftButton } from "./CraftButton";
import { CraftCard } from "./CraftCard";
import { CraftContainer } from "./CraftContainer";
import { CraftDivider } from "./CraftDivider";
import { CraftGrid } from "./CraftGrid";
import { CraftImage } from "./CraftImage";
import { CraftSection } from "./CraftSection";
import { CraftSpacer } from "./CraftSpacer";
import { CraftText } from "./CraftText";

export interface CraftViewerProps {
  data?: string;
}

export const CraftViewer = ({ data }: CraftViewerProps) => {
  // Ensure we only attempt to render if there is actual saved JSON data
  const hasData = data && data !== "{}" && data !== '""';

  if (!hasData) {
    return null;
  }

  return (
    <div className="craft-viewer-wrapper">
      <Editor
        enabled={false} // Read-only mode
        resolver={{
          CraftContainer,
          CraftText,
          CraftButton,
          CraftCard,
          CraftDivider,
          CraftGrid,
          CraftImage,
          CraftSection,
          CraftSpacer,
        }}
      >
        {/* The Frame component consumes the serialized JSON string and rebuilds the node tree */}
        <Frame data={data} />
      </Editor>
    </div>
  );
};
