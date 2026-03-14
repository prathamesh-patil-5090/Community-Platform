"use client";

import { useNode } from "@craftjs/core";
import {
    Box,
    FormControl,
    FormLabel,
    Slider,
    TextField,
} from "@mui/material";
import React from "react";

export interface CraftSectionProps {
  background?: string;
  padding?: number;
  margin?: number;
  customCss?: string;
  children?: React.ReactNode;
}

export const CraftSection = ({
  background = "transparent",
  padding = 40,
  margin = 0,
  customCss = "",
  children,
}: CraftSectionProps) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  let customStyles = {};
  try {
    if (customCss) {
      customStyles = JSON.parse(customCss);
    }
  } catch {
    // Ignore invalid JSON
  }

  return (
    <Box
      component="section"
      ref={(ref: HTMLElement | null) => {
        if (ref) connect(drag(ref));
      }}
      sx={{
        background,
        padding: `${padding}px`,
        margin: `${margin}px`,
        width: "100%",
        minHeight: "50px",
        border: selected
          ? "2px solid #2196f3"
          : hovered
            ? "1px dashed #2196f3"
            : "1px dashed transparent",
        transition: "border 0.2s ease-in-out",
        boxSizing: "border-box",
        ...customStyles,
      }}
    >
      {children}
    </Box>
  );
};

export const CraftSectionSettings = () => {
  const {
    background,
    padding,
    margin,
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    margin: node.data.props.margin,
    customCss: node.data.props.customCss,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <FormControl>
        <FormLabel>Background Color</FormLabel>
        <TextField
          type="color"
          value={background || "transparent"}
          onChange={(e) =>
            setProp(
              (props: CraftSectionProps) =>
                (props.background = e.target.value),
            )
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Padding (px)</FormLabel>
        <Slider
          value={padding || 0}
          onChange={(_, value) =>
            setProp(
              (props: CraftSectionProps) => (props.padding = value as number),
            )
          }
          min={0}
          max={200}
          valueLabelDisplay="auto"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Margin (px)</FormLabel>
        <Slider
          value={margin || 0}
          onChange={(_, value) =>
            setProp(
              (props: CraftSectionProps) => (props.margin = value as number),
            )
          }
          min={0}
          max={100}
          valueLabelDisplay="auto"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Custom CSS (JSON for sx prop)</FormLabel>
        <TextField
          multiline
          rows={4}
          value={customCss || ""}
          onChange={(e) =>
            setProp(
              (props: CraftSectionProps) => (props.customCss = e.target.value),
            )
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          placeholder='{"borderRadius": "8px", "boxShadow": "0 4px 8px rgba(0,0,0,0.1)"}'
        />
      </FormControl>
    </Box>
  );
};

CraftSection.craft = {
  displayName: "Section",
  props: {
    background: "transparent",
    padding: 40,
    margin: 0,
    customCss: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  related: {
    settings: CraftSectionSettings,
  },
};
