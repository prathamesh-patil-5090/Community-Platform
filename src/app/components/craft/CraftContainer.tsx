"use client";

import { useNode } from "@craftjs/core";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Slider,
  TextField,
} from "@mui/material";
import React from "react";

export interface CraftContainerProps {
  background?: string;
  padding?: number;
  margin?: number;
  flexDirection?: "row" | "column";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around";
  children?: React.ReactNode;
}

export const CraftContainer = ({
  background = "#ffffff",
  padding = 20,
  margin = 0,
  flexDirection = "column",
  alignItems = "stretch",
  justifyContent = "flex-start",
  children,
}: CraftContainerProps) => {
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
        background,
        padding: `${padding}px`,
        margin: `${margin}px`,
        display: "flex",
        flexDirection,
        alignItems,
        justifyContent,
        minHeight: "50px", // ensure empty containers are droppable/visible
        // Add a subtle border when editing for visibility
        border: selected
          ? "2px solid #2196f3"
          : hovered
            ? "1px dashed #2196f3"
            : "1px dashed #e0e0e0",
        borderRadius: "4px",
        transition: "border 0.2s ease-in-out",
        position: "relative",
      }}
    >
      {children}
    </Box>
  );
};

export const CraftContainerSettings = () => {
  const {
    background,
    padding,
    margin,
    flexDirection,
    alignItems,
    justifyContent,
    actions: { setProp },
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    margin: node.data.props.margin,
    flexDirection: node.data.props.flexDirection,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
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
              (props: CraftContainerProps) =>
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
              (props: CraftContainerProps) => (props.padding = value as number),
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
            setProp(
              (props: CraftContainerProps) => (props.margin = value as number),
            )
          }
          min={0}
          max={100}
          valueLabelDisplay="auto"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Direction</FormLabel>
        <RadioGroup
          row
          value={flexDirection || "column"}
          onChange={(e) =>
            setProp(
              (props: CraftContainerProps) =>
                (props.flexDirection = e.target
                  .value as CraftContainerProps["flexDirection"]),
            )
          }
        >
          <FormControlLabel value="row" control={<Radio />} label="Row" />
          <FormControlLabel value="column" control={<Radio />} label="Column" />
        </RadioGroup>
      </FormControl>

      <FormControl>
        <FormLabel>Align Items</FormLabel>
        <RadioGroup
          value={alignItems || "stretch"}
          onChange={(e) =>
            setProp(
              (props: CraftContainerProps) =>
                (props.alignItems = e.target
                  .value as CraftContainerProps["alignItems"]),
            )
          }
        >
          <FormControlLabel
            value="flex-start"
            control={<Radio size="small" />}
            label="Start"
          />
          <FormControlLabel
            value="center"
            control={<Radio size="small" />}
            label="Center"
          />
          <FormControlLabel
            value="flex-end"
            control={<Radio size="small" />}
            label="End"
          />
          <FormControlLabel
            value="stretch"
            control={<Radio size="small" />}
            label="Stretch"
          />
        </RadioGroup>
      </FormControl>

      <FormControl>
        <FormLabel>Justify Content</FormLabel>
        <RadioGroup
          value={justifyContent || "flex-start"}
          onChange={(e) =>
            setProp(
              (props: CraftContainerProps) =>
                (props.justifyContent = e.target
                  .value as CraftContainerProps["justifyContent"]),
            )
          }
        >
          <FormControlLabel
            value="flex-start"
            control={<Radio size="small" />}
            label="Start"
          />
          <FormControlLabel
            value="center"
            control={<Radio size="small" />}
            label="Center"
          />
          <FormControlLabel
            value="flex-end"
            control={<Radio size="small" />}
            label="End"
          />
          <FormControlLabel
            value="space-between"
            control={<Radio size="small" />}
            label="Space Between"
          />
          <FormControlLabel
            value="space-around"
            control={<Radio size="small" />}
            label="Space Around"
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

CraftContainer.craft = {
  displayName: "Container",
  props: {
    background: "#ffffff",
    padding: 20,
    margin: 0,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  related: {
    settings: CraftContainerSettings,
  },
};
