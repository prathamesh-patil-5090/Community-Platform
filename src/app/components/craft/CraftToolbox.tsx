"use client";

import { Element, useEditor } from "@craftjs/core";
import { Box, Divider, Button as MuiButton, Typography } from "@mui/material";
import { CraftButton } from "./CraftButton";
import { CraftCard } from "./CraftCard";
import { CraftContainer } from "./CraftContainer";
import { CraftDivider } from "./CraftDivider";
import { CraftGrid } from "./CraftGrid";
import { CraftImage } from "./CraftImage";
import { CraftSection } from "./CraftSection";
import { CraftSpacer } from "./CraftSpacer";
import { CraftText } from "./CraftText";

export const CraftToolbox = () => {
  const {
    connectors: { create },
  } = useEditor();

  const CategoryLabel = ({ children }: { children: React.ReactNode }) => (
    <Typography
      variant="caption"
      sx={{
        fontWeight: "bold",
        textTransform: "uppercase",
        color: "text.secondary",
        mt: 2,
        mb: 1,
        display: "block",
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Box sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Drag to Add
      </Typography>
      <Divider sx={{ mb: 1.5 }} />

      <CategoryLabel>Layout</CategoryLabel>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(ref, <Element is={CraftSection} canvas />);
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Section
        </MuiButton>

        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(ref, <Element is={CraftContainer} canvas />);
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Container
        </MuiButton>

        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(ref, <Element is={CraftGrid} canvas />);
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Grid
        </MuiButton>
      </Box>

      <CategoryLabel>Content</CategoryLabel>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(
                ref,
                <CraftText
                  text="Heading"
                  fontSize={32}
                  textAlign="left"
                  fontWeight="bold"
                  color="#ffffff"
                  variant="h2"
                  margin={0}
                />,
              );
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Heading
        </MuiButton>

        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(
                ref,
                <CraftText
                  text="New Text"
                  fontSize={16}
                  textAlign="left"
                  fontWeight="normal"
                  color="#ffffff"
                  variant="body1"
                  margin={0}
                />,
              );
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Text
        </MuiButton>

        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(ref, <CraftImage />);
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Image
        </MuiButton>

        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(
                ref,
                <CraftButton
                  text="Button"
                  size="medium"
                  variant="contained"
                  color="primary"
                  href=""
                  fullWidth={false}
                  margin={0}
                />,
              );
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Button
        </MuiButton>
      </Box>

      <CategoryLabel>Blocks</CategoryLabel>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(ref, <Element is={CraftCard} canvas />);
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Card
        </MuiButton>
      </Box>

      <CategoryLabel>Utility</CategoryLabel>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(ref, <CraftSpacer />);
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Spacer
        </MuiButton>

        <MuiButton
          variant="outlined"
          size="small"
          ref={(ref: HTMLButtonElement | null) => {
            if (ref) {
              create(ref, <CraftDivider />);
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Divider
        </MuiButton>
      </Box>
    </Box>
  );
};
