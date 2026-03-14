"use client";

import { useNode } from "@craftjs/core";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef } from "react";

export interface CraftTextProps {
  text: string;
  fontSize: number;
  textAlign: "left" | "center" | "right" | "justify";
  fontWeight: "normal" | "bold" | "500" | "600" | "700";
  color: string;
  variant: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1" | "body2";
  margin: number;
  customCss?: string;
}

export const CraftText = ({
  text,
  fontSize,
  textAlign,
  fontWeight,
  color,
  variant,
  margin,
  customCss = "",
}: CraftTextProps) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const textRef = useRef<HTMLSpanElement>(null);

  let customStyles = {};
  try {
    if (customCss) {
      customStyles = JSON.parse(customCss);
    }
  } catch {
    // Ignore invalid JSON
  }

  // Sync internal innerText if the prop changes from the outside (e.g. from Settings)
  useEffect(() => {
    if (textRef.current && textRef.current.innerText !== text) {
      textRef.current.innerText = text;
    }
  }, [text]);

  return (
    <Typography
      ref={(ref: HTMLElement | null) => {
        if (ref) connect(drag(ref));
      }}
      variant={variant}
      sx={{
        fontSize: `${fontSize}px`,
        textAlign,
        fontWeight,
        color,
        margin: `${margin}px`,
        outline: selected
          ? "2px solid #2196f3"
          : hovered
            ? "1px dashed #2196f3"
            : "transparent",
        outlineOffset: "2px",
        transition: "outline 0.2s",
        minHeight: "24px",
        ...customStyles,
      }}
    >
      <span
        ref={textRef}
        contentEditable={selected}
        suppressContentEditableWarning={true}
        onBlur={(e) => {
          const currentText = e.currentTarget.innerText;
          setProp((props: CraftTextProps) => {
            props.text = currentText;
          });
        }}
        style={{
          outline: "none",
          cursor: selected ? "text" : "default",
          display: "inline-block",
          width: "100%",
        }}
      >
        {text}
      </span>
    </Typography>
  );
};

export const CraftTextSettings = () => {
  const {
    text,
    fontSize,
    textAlign,
    fontWeight,
    color,
    variant,
    margin,
    customCss,
    actions: { setProp },
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    textAlign: node.data.props.textAlign,
    fontWeight: node.data.props.fontWeight,
    color: node.data.props.color,
    variant: node.data.props.variant,
    margin: node.data.props.margin,
    customCss: node.data.props.customCss,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <FormControl>
        <FormLabel>Text Content</FormLabel>
        <TextField
          multiline
          minRows={2}
          value={text || ""}
          onChange={(e) =>
            setProp((props: CraftTextProps) => (props.text = e.target.value))
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Typography Variant</FormLabel>
        <Select
          size="small"
          value={variant || "body1"}
          onChange={(e) =>
            setProp(
              (props: CraftTextProps) =>
                (props.variant = e.target.value as CraftTextProps["variant"]),
            )
          }
          sx={{ mt: 1 }}
        >
          <MenuItem value="h1">Heading 1 (h1)</MenuItem>
          <MenuItem value="h2">Heading 2 (h2)</MenuItem>
          <MenuItem value="h3">Heading 3 (h3)</MenuItem>
          <MenuItem value="h4">Heading 4 (h4)</MenuItem>
          <MenuItem value="h5">Heading 5 (h5)</MenuItem>
          <MenuItem value="h6">Heading 6 (h6)</MenuItem>
          <MenuItem value="body1">Body 1</MenuItem>
          <MenuItem value="body2">Body 2</MenuItem>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Color</FormLabel>
        <TextField
          type="color"
          value={color || "#000000"}
          onChange={(e) =>
            setProp((props: CraftTextProps) => (props.color = e.target.value))
          }
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Font Size (px)</FormLabel>
        <Slider
          value={fontSize || 16}
          onChange={(_, value) =>
            setProp(
              (props: CraftTextProps) => (props.fontSize = value as number),
            )
          }
          min={8}
          max={120}
          valueLabelDisplay="auto"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Font Weight</FormLabel>
        <Select
          size="small"
          value={fontWeight || "normal"}
          onChange={(e) =>
            setProp(
              (props: CraftTextProps) =>
                (props.fontWeight = e.target
                  .value as CraftTextProps["fontWeight"]),
            )
          }
          sx={{ mt: 1 }}
        >
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="500">Medium (500)</MenuItem>
          <MenuItem value="600">Semi-Bold (600)</MenuItem>
          <MenuItem value="bold">Bold (700)</MenuItem>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Text Align</FormLabel>
        <RadioGroup
          row
          value={textAlign || "left"}
          onChange={(e) =>
            setProp(
              (props: CraftTextProps) =>
                (props.textAlign = e.target
                  .value as CraftTextProps["textAlign"]),
            )
          }
        >
          <FormControlLabel
            value="left"
            control={<Radio size="small" />}
            label="Left"
          />
          <FormControlLabel
            value="center"
            control={<Radio size="small" />}
            label="Center"
          />
          <FormControlLabel
            value="right"
            control={<Radio size="small" />}
            label="Right"
          />
          <FormControlLabel
            value="justify"
            control={<Radio size="small" />}
            label="Justify"
          />
        </RadioGroup>
      </FormControl>

      <FormControl>
        <FormLabel>Margin (px)</FormLabel>
        <Slider
          value={margin || 0}
          onChange={(_, value) =>
            setProp((props: CraftTextProps) => (props.margin = value as number))
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
              (props: CraftTextProps) => (props.customCss = e.target.value),
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

CraftText.craft = {
  displayName: "Text",
  props: {
    text: "Edit this text",
    fontSize: 16,
    textAlign: "left",
    fontWeight: "normal",
    color: "#ffffff",
    variant: "body1",
    margin: 0,
    customCss: "",
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: CraftTextSettings,
  },
};
