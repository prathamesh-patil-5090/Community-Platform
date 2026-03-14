"use client";

import { useNode } from "@craftjs/core";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Button as MuiButton,
  Select,
  Slider,
  Switch,
  TextField,
} from "@mui/material";

export interface CraftButtonProps {
  text: string;
  size: "small" | "medium" | "large";
  variant: "text" | "outlined" | "contained";
  color:
    | "inherit"
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning";
  href: string;
  fullWidth: boolean;
  margin: number;
  customCss?: string;
}

export const CraftButton = ({
  text,
  size,
  variant,
  color,

  fullWidth,
  margin,
  customCss = "",
}: CraftButtonProps) => {
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
        display: fullWidth ? "block" : "inline-block",
        outline: selected
          ? "2px solid #2196f3"
          : hovered
            ? "1px dashed #2196f3"
            : "transparent",
        outlineOffset: "2px",
        transition: "outline 0.2s",
        width: fullWidth ? "100%" : "auto",
        cursor: "grab",
        ...customStyles,
      }}
    >
      <MuiButton
        size={size}
        variant={variant}
        color={color}
        fullWidth={fullWidth}
        // In the builder we use div to prevent default navigation/clicks
        component="div"
        sx={{
          pointerEvents: "none", // Prevent button click interactions while editing
        }}
      >
        {text}
      </MuiButton>
    </Box>
  );
};

export const CraftButtonSettings = () => {
  const {
    text,
    size,
    variant,
    color,
    href,
    fullWidth,
    margin,
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    text: node.data.props.text,
    size: node.data.props.size,
    variant: node.data.props.variant,
    color: node.data.props.color,
    href: node.data.props.href,
    fullWidth: node.data.props.fullWidth,
    margin: node.data.props.margin,
    customCss: node.data.props.customCss,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <FormControl>
        <FormLabel>Button Text</FormLabel>
        <TextField
          value={text || ""}
          onChange={(e) =>
            setProp((props: CraftButtonProps) => (props.text = e.target.value))
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Link URL</FormLabel>
        <TextField
          value={href || ""}
          onChange={(e) =>
            setProp((props: CraftButtonProps) => (props.href = e.target.value))
          }
          size="small"
          placeholder="https://..."
          fullWidth
          sx={{ mt: 1 }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Variant</FormLabel>
        <Select
          size="small"
          value={variant || "contained"}
          onChange={(e) =>
            setProp(
              (props: CraftButtonProps) =>
                (props.variant = e.target.value as CraftButtonProps["variant"]),
            )
          }
          sx={{ mt: 1 }}
        >
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="outlined">Outlined</MenuItem>
          <MenuItem value="contained">Contained</MenuItem>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Color</FormLabel>
        <Select
          size="small"
          value={color || "primary"}
          onChange={(e) =>
            setProp(
              (props: CraftButtonProps) =>
                (props.color = e.target.value as CraftButtonProps["color"]),
            )
          }
          sx={{ mt: 1 }}
        >
          <MenuItem value="inherit">Inherit</MenuItem>
          <MenuItem value="primary">Primary</MenuItem>
          <MenuItem value="secondary">Secondary</MenuItem>
          <MenuItem value="success">Success</MenuItem>
          <MenuItem value="error">Error</MenuItem>
          <MenuItem value="info">Info</MenuItem>
          <MenuItem value="warning">Warning</MenuItem>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Size</FormLabel>
        <Select
          size="small"
          value={size || "medium"}
          onChange={(e) =>
            setProp(
              (props: CraftButtonProps) =>
                (props.size = e.target.value as CraftButtonProps["size"]),
            )
          }
          sx={{ mt: 1 }}
        >
          <MenuItem value="small">Small</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="large">Large</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={fullWidth || false}
            onChange={(e) =>
              setProp(
                (props: CraftButtonProps) =>
                  (props.fullWidth = e.target.checked),
              )
            }
          />
        }
        label="Full Width"
      />

      <FormControl>
        <FormLabel>Margin (px)</FormLabel>
        <Slider
          value={margin || 0}
          onChange={(_, value) =>
            setProp(
              (props: CraftButtonProps) => (props.margin = value as number),
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
              (props: CraftButtonProps) => (props.customCss = e.target.value),
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

CraftButton.craft = {
  displayName: "Button",
  props: {
    text: "Click Me",
    size: "medium",
    variant: "contained",
    color: "primary",
    href: "",
    fullWidth: false,
    margin: 0,
    customCss: "",
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: CraftButtonSettings,
  },
};
