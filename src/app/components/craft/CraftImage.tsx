"use client";

import { useNode } from "@craftjs/core";
import {
    Box,
    FormControl,
    FormLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";

export interface CraftImageProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  customCss?: string;
}

export const CraftImage = ({
  src = "https://via.placeholder.com/400x300",
  alt = "Placeholder Image",
  width = "100%",
  height = "auto",
  objectFit = "cover",
  customCss = "",
}: CraftImageProps) => {
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
      component="img"
      ref={(ref: HTMLImageElement | null) => {
        if (ref) connect(drag(ref));
      }}
      src={src}
      alt={alt}
      sx={{
        width,
        height,
        objectFit,
        display: "block",
        outline: selected
          ? "2px solid #2196f3"
          : hovered
            ? "1px dashed #2196f3"
            : "none",
        outlineOffset: "2px",
        transition: "outline 0.2s ease-in-out",
        ...customStyles,
      }}
    />
  );
};

export const CraftImageSettings = () => {
  const {
    src,
    alt,
    width,
    height,
    objectFit,
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    width: node.data.props.width,
    height: node.data.props.height,
    objectFit: node.data.props.objectFit,
    customCss: node.data.props.customCss,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <FormControl>
        <FormLabel>Image URL (src)</FormLabel>
        <TextField
          value={src || ""}
          onChange={(e) =>
            setProp((props: CraftImageProps) => (props.src = e.target.value))
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Alt Text</FormLabel>
        <TextField
          value={alt || ""}
          onChange={(e) =>
            setProp((props: CraftImageProps) => (props.alt = e.target.value))
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Width</FormLabel>
        <TextField
          value={width || ""}
          onChange={(e) =>
            setProp((props: CraftImageProps) => (props.width = e.target.value))
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          placeholder="e.g., 100%, 300px"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Height</FormLabel>
        <TextField
          value={height || ""}
          onChange={(e) =>
            setProp((props: CraftImageProps) => (props.height = e.target.value))
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          placeholder="e.g., auto, 200px"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Object Fit</FormLabel>
        <Select
          value={objectFit || "cover"}
          onChange={(e) =>
            setProp(
              (props: CraftImageProps) =>
                (props.objectFit = e.target.value as CraftImageProps["objectFit"])
            )
          }
          size="small"
          sx={{ mt: 1 }}
        >
          <MenuItem value="fill">Fill</MenuItem>
          <MenuItem value="contain">Contain</MenuItem>
          <MenuItem value="cover">Cover</MenuItem>
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="scale-down">Scale Down</MenuItem>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Custom CSS (JSON for sx prop)</FormLabel>
        <TextField
          multiline
          rows={4}
          value={customCss || ""}
          onChange={(e) =>
            setProp(
              (props: CraftImageProps) => (props.customCss = e.target.value)
            )
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          placeholder='{"borderRadius": "8px"}'
        />
      </FormControl>
    </Box>
  );
};

CraftImage.craft = {
  displayName: "Image",
  props: {
    src: "https://via.placeholder.com/400x300",
    alt: "Placeholder Image",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    customCss: "",
  },
  rules: {
    canDrag: () => true,
    canDrop: () => false,
  },
  related: {
    settings: CraftImageSettings,
  },
};
