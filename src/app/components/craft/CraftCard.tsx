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

export interface CraftCardProps {
  background?: string;
  padding?: number;
  margin?: number;
  elevation?: number;
  children?: React.ReactNode;
}

export const CraftCard = ({
  background = "#ffffff",
  padding = 16,
  margin = 8,
  elevation = 1,
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
    actions: { setProp },
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    margin: node.data.props.margin,
    elevation: node.data.props.elevation,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <FormControl>
        <FormLabel>Background Color</FormLabel>
        <TextField
          type="color"
          value={background || "#ffffff"}
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

      <FormControl>
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

      <FormControl>
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

      <FormControl>
        <FormLabel>Margin (px)</FormLabel>
        <Slider
          value={margin || 0}
          onChange={(_, value) =>
            setProp((props: CraftCardProps) => (props.margin = value as number))
          }
          min={0}
          max={100}
          valueLabelDisplay="auto"
        />
      </FormControl>
    </Box>
  );
};

CraftCard.craft = {
  displayName: "Card",
  props: {
    background: "#ffffff",
    padding: 16,
    margin: 8,
    elevation: 1,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  related: {
    settings: CraftCardSettings,
  },
};
