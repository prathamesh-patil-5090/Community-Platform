"use client";

import { Element, Frame } from "@craftjs/core";
import { Box } from "@mui/material";
import { CraftContainer } from "./CraftContainer";

export interface CraftEditorAreaProps {
  initialData?: string;
}

export const CraftEditorArea = ({ initialData }: CraftEditorAreaProps) => {
  // If initialData is an empty string or empty object "{}", we shouldn't pass it as data
  // otherwise Craft.js might render nothing instead of our default Element
  const hasData = initialData && initialData !== "{}" && initialData !== '""';

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: "500px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px dashed rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
        overflow: "auto",
        p: 1,
      }}
    >
      <Frame data={hasData ? initialData : undefined}>
        <Element
          is={CraftContainer}
          canvas
          background="transparent"
          padding={40}
          margin={0}
          flexDirection="column"
          alignItems="stretch"
          justifyContent="flex-start"
        />
      </Frame>
    </Box>
  );
};
