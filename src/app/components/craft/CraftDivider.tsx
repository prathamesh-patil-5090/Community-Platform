"use client";

import { useNode } from "@craftjs/core";
import {
  Box,
  Divider,
  FormControl,
  FormLabel,
  Slider,
  TextField,
} from "@mui/material";
import { SettingsAccordion } from "./SettingsAccordion";

export interface CraftDividerProps {
  margin?: number;
  color?: string;
  customCss?: string;
}

export const CraftDivider = ({
  margin = 16,
  color = "rgba(255, 255, 255, 0.2)",
  customCss = "",
}: CraftDividerProps) => {
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
      ref={(ref: HTMLDivElement | null) => {
        if (ref) connect(drag(ref));
      }}
      sx={{
        py: `${margin}px`,
        width: "100%",
        flexShrink: 0,
        cursor: "pointer",
        outline: selected
          ? "2px solid #2196f3"
          : hovered
            ? "1px dashed #2196f3"
            : "none",
        outlineOffset: "-2px",
        transition: "outline 0.2s ease-in-out",
        boxSizing: "border-box",
        ...customStyles,
      }}
    >
      <Divider sx={{ borderColor: color, borderBottomWidth: "1px" }} />
    </Box>
  );
};

export const CraftDividerSettings = () => {
  const {
    margin,
    color,
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    margin: node.data.props.margin,
    color: node.data.props.color,
    customCss: node.data.props.customCss,
  }));

  return (
    <>
      <SettingsAccordion title="Spacing">
        <FormControl fullWidth>
          <FormLabel>Vertical Margin (px)</FormLabel>
          <Slider
            value={margin || 0}
            onChange={(_, value) =>
              setProp(
                (props: CraftDividerProps) => (props.margin = value as number),
              )
            }
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </FormControl>
      </SettingsAccordion>

      <SettingsAccordion title="Appearance">
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Color</FormLabel>
          <TextField
            type="color"
            value={color?.startsWith("rgba") ? "#ffffff" : color || "#ffffff"}
            onChange={(e) =>
              setProp(
                (props: CraftDividerProps) => (props.color = e.target.value),
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
                (props: CraftDividerProps) =>
                  (props.customCss = e.target.value),
              )
            }
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            placeholder='{"borderBottomStyle": "dashed"}'
          />
        </FormControl>
      </SettingsAccordion>
    </>
  );
};

CraftDivider.craft = {
  displayName: "Divider",
  props: {
    margin: 16,
    color: "rgba(255, 255, 255, 0.2)",
    customCss: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
  },
  related: {
    settings: CraftDividerSettings,
  },
};
