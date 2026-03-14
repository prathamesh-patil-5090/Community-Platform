"use client";

import { useNode } from "@craftjs/core";
import { Box, FormControl, FormLabel, Slider, TextField } from "@mui/material";

export interface CraftSpacerProps {
  height?: number;
  customCss?: string;
}

export const CraftSpacer = ({
  height = 20,
  customCss = "",
}: CraftSpacerProps) => {
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
        width: "100%",
        height: `${height}px`,
        display: "block",
        background: selected
          ? "rgba(33, 150, 243, 0.1)"
          : hovered
            ? "rgba(33, 150, 243, 0.05)"
            : "transparent",
        border: selected
          ? "1px dashed #2196f3"
          : hovered
            ? "1px dashed #90caf9"
            : "1px dashed transparent",
        transition: "all 0.2s ease-in-out",
        boxSizing: "border-box",
        ...customStyles,
      }}
    />
  );
};

export const CraftSpacerSettings = () => {
  const {
    height,
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    height: node.data.props.height,
    customCss: node.data.props.customCss,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <FormControl>
        <FormLabel>Height (px)</FormLabel>
        <Slider
          value={height || 20}
          onChange={(_, value) =>
            setProp(
              (props: CraftSpacerProps) => (props.height = value as number),
            )
          }
          min={0}
          max={200}
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
              (props: CraftSpacerProps) => (props.customCss = e.target.value),
            )
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          placeholder='{"backgroundColor": "#f0f0f0"}'
        />
      </FormControl>
    </Box>
  );
};

CraftSpacer.craft = {
  displayName: "Spacer",
  props: {
    height: 20,
    customCss: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
  },
  related: {
    settings: CraftSpacerSettings,
  },
};
