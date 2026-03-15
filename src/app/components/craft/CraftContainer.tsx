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
import { SettingsAccordion } from "./SettingsAccordion";

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
  customCss?: string;
  children?: React.ReactNode;
}

export const CraftContainer = ({
  background = "#000000",
  padding = 20,
  margin = 0,
  flexDirection = "column",
  alignItems = "stretch",
  justifyContent = "flex-start",
  customCss = "",
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
        ...customStyles,
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
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    margin: node.data.props.margin,
    flexDirection: node.data.props.flexDirection,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
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
                (props: CraftContainerProps) =>
                  (props.background = e.target.value),
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
                (props: CraftContainerProps) =>
                  (props.customCss = e.target.value),
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
                (props: CraftContainerProps) =>
                  (props.padding = value as number),
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
                (props: CraftContainerProps) =>
                  (props.margin = value as number),
              )
            }
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </FormControl>
      </SettingsAccordion>

      <SettingsAccordion title="Layout">
        <FormControl fullWidth sx={{ mb: 2 }}>
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
            <FormControlLabel
              value="column"
              control={<Radio />}
              label="Column"
            />
          </RadioGroup>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
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

        <FormControl fullWidth>
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
      </SettingsAccordion>
    </>
  );
};

CraftContainer.craft = {
  displayName: "Container",
  props: {
    background: "#000000",
    padding: 20,
    margin: 0,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    customCss: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  related: {
    settings: CraftContainerSettings,
  },
};
