"use client";

import { useNode } from "@craftjs/core";
import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Slider,
  TextField,
} from "@mui/material";
import React from "react";
import { SettingsAccordion } from "./SettingsAccordion";

export interface CraftCardProps {
  background?: string;
  padding?: number;
  margin?: number;
  elevation?: number;
  customCss?: string;
  children?: React.ReactNode;
}

export const CraftCard = ({
  background = "#000000",
  padding = 16,
  margin = 8,
  elevation = 1,
  customCss = "",
  children,
}: CraftCardProps) => {
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
        margin: `${margin}px`,
        outline: selected
          ? "2px solid #2196f3"
          : hovered
            ? "1px dashed #2196f3"
            : "transparent",
        outlineOffset: "2px",
        transition: "outline 0.2s",
        position: "relative",
      }}
    >
      <Card
        elevation={elevation}
        sx={{
          background,
          minHeight: "50px", // to ensure it's droppable even when empty
          height: "100%",
          ...customStyles,
        }}
      >
        <CardContent
          sx={{
            padding: `${padding}px !important`, // override MUI's default padding
            height: "100%",
          }}
        >
          {children}
        </CardContent>
      </Card>
    </Box>
  );
};

export const CraftCardSettings = () => {
  const {
    background,
    padding,
    margin,
    elevation,
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    margin: node.data.props.margin,
    elevation: node.data.props.elevation,
    customCss: node.data.props.customCss,
  }));

  return (
    <>
      <SettingsAccordion title="Appearance">
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Background Color</FormLabel>
          <TextField
            type="color"
            value={background || "#000000"}
            onChange={(e) =>
              setProp(
                (props: CraftCardProps) => (props.background = e.target.value),
              )
            }
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          />
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Elevation (Shadow)</FormLabel>
          <Slider
            value={elevation || 1}
            onChange={(_, value) =>
              setProp(
                (props: CraftCardProps) => (props.elevation = value as number),
              )
            }
            min={0}
            max={24}
            valueLabelDisplay="auto"
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
                (props: CraftCardProps) => (props.customCss = e.target.value),
              )
            }
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            placeholder='{"borderRadius": "8px", "boxShadow": "0 4px 8px rgba(0,0,0,0.1)"}'
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
                (props: CraftCardProps) => (props.padding = value as number),
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
                (props: CraftCardProps) => (props.margin = value as number),
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

CraftCard.craft = {
  displayName: "Card",
  props: {
    background: "#000000",
    padding: 16,
    margin: 8,
    elevation: 1,
    customCss: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  related: {
    settings: CraftCardSettings,
  },
};
