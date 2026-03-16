"use client";

import { useNode } from "@craftjs/core";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import React, { useRef, useState } from "react";
import { SettingsAccordion } from "./SettingsAccordion";

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

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Uses the same upload endpoint as the CoverImage component
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      const imageUrl = data.url || data.secure_url;
      if (imageUrl) {
        setProp((props: CraftImageProps) => (props.src = imageUrl));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
      // Reset input so the user can upload the same file again if they want
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <SettingsAccordion title="Source">
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Upload Image</FormLabel>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            sx={{ mt: 1 }}
          >
            {isUploading ? <CircularProgress size={24} /> : "Choose Image"}
          </Button>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
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

        <FormControl fullWidth>
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
      </SettingsAccordion>

      <SettingsAccordion title="Dimensions">
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Width</FormLabel>
          <TextField
            value={width || ""}
            onChange={(e) =>
              setProp(
                (props: CraftImageProps) => (props.width = e.target.value),
              )
            }
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            placeholder="e.g., 100%, 300px"
          />
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Height</FormLabel>
          <TextField
            value={height || ""}
            onChange={(e) =>
              setProp(
                (props: CraftImageProps) => (props.height = e.target.value),
              )
            }
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            placeholder="e.g., auto, 200px"
          />
        </FormControl>

        <FormControl fullWidth>
          <FormLabel>Object Fit</FormLabel>
          <Select
            value={objectFit || "cover"}
            onChange={(e) =>
              setProp(
                (props: CraftImageProps) =>
                  (props.objectFit = e.target
                    .value as CraftImageProps["objectFit"]),
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
      </SettingsAccordion>

      <SettingsAccordion title="Appearance">
        <FormControl fullWidth>
          <FormLabel>Custom CSS (JSON for sx prop)</FormLabel>
          <TextField
            multiline
            rows={4}
            value={customCss || ""}
            onChange={(e) =>
              setProp(
                (props: CraftImageProps) => (props.customCss = e.target.value),
              )
            }
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            placeholder='{"borderRadius": "8px"}'
          />
        </FormControl>
      </SettingsAccordion>
    </>
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
  },
  related: {
    settings: CraftImageSettings,
  },
};
