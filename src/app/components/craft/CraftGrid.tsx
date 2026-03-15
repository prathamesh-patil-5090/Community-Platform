"use client";

import { useNode } from "@craftjs/core";
import { Box, FormControl, FormLabel, Slider, TextField } from "@mui/material";
import React from "react";
import { SettingsAccordion } from "./SettingsAccordion";

export interface CraftGridProps {
  columns?: number;
  gap?: number;
  padding?: number;
  margin?: number;
  background?: string;
  customCss?: string;
  children?: React.ReactNode;
}

export const CraftGrid = ({
  columns = 2,
  gap = 16,
  padding = 20,
  margin = 0,
  background = "#000000",
  customCss = "",
  children,
}: CraftGridProps) => {
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
      ref={(ref: HTMLElement | null) => {
        if (ref) connect(drag(ref));
      }}
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        background,
        padding: `${padding}px`,
        margin: `${margin}px`,
        minHeight: "50px",
        border: selected
          ? "2px solid #2196f3"
          : hovered
            ? "1px dashed #2196f3"
            : "1px dashed #e0e0e0",
        transition: "border 0.2s ease-in-out",
        boxSizing: "border-box",
        ...customStyles,
      }}
    >
      {children}
    </Box>
  );
};

export const CraftGridSettings = () => {
  const {
    columns,
    gap,
    padding,
    margin,
    background,
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    columns: node.data.props.columns,
    gap: node.data.props.gap,
    padding: node.data.props.padding,
    margin: node.data.props.margin,
    background: node.data.props.background,
    customCss: node.data.props.customCss,
  }));

  return (
    <>
      <SettingsAccordion title="Layout">
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Columns</FormLabel>
          <Slider
            value={columns || 2}
            onChange={(_, value) =>
              setProp(
                (props: CraftGridProps) => (props.columns = value as number),
              )
            }
            min={1}
            max={12}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </FormControl>

        <FormControl fullWidth>
          <FormLabel>Grid Gap (px)</FormLabel>
          <Slider
            value={gap || 0}
            onChange={(_, value) =>
              setProp((props: CraftGridProps) => (props.gap = value as number))
            }
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </FormControl>
      </SettingsAccordion>

      <SettingsAccordion title="Appearance">
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Background Color</FormLabel>
          <TextField
            type="color"
            value={background || "#000000"}
            onChange={(e) =>
              setProp(
                (props: CraftGridProps) => (props.background = e.target.value),
              )
            }
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          />
        </FormControl>

        <FormControl fullWidth>
          <FormLabel>Custom CSS (JSON for sx prop)</FormLabel>
          <TextField
            multiline
            rows={4}
            value={customCss || ""}
            onChange={(e) =>
              setProp(
                (props: CraftGridProps) => (props.customCss = e.target.value),
              )
            }
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            placeholder='{"alignItems": "center"}'
          />
        </FormControl>
      </SettingsAccordion>

      <SettingsAccordion title="Spacing">
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Padding (px)</FormLabel>
          <Slider
            value={padding || 0}
            onChange={(_, value) =>
              setProp(
                (props: CraftGridProps) => (props.padding = value as number),
              )
            }
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </FormControl>

        <FormControl fullWidth>
          <FormLabel>Margin (px)</FormLabel>
          <Slider
            value={margin || 0}
            onChange={(_, value) =>
              setProp(
                (props: CraftGridProps) => (props.margin = value as number),
              )
            }
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </FormControl>
      </SettingsAccordion>
    </>
  );
};

CraftGrid.craft = {
  displayName: "Grid",
  props: {
    columns: 2,
    gap: 16,
    padding: 20,
    margin: 0,
    background: "#000000",
    customCss: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  related: {
    settings: CraftGridSettings,
  },
};
