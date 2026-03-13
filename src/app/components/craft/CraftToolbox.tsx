"use client";

import { Element, useEditor } from "@craftjs/core";
import { Box, Divider, Button as MuiButton, Typography } from "@mui/material";
import { CraftButton } from "./CraftButton";
import { CraftCard } from "./CraftCard";
import { CraftContainer } from "./CraftContainer";
import { CraftText } from "./CraftText";

export const CraftToolbox = () => {
  const {
    connectors: { create },
  } = useEditor();

  return (
    <Box sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Drag to Add
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
              create(ref, <Element is={CraftCard} canvas />);
            }
          }}
          sx={{ cursor: "grab", fontSize: "0.75rem", py: 0.5 }}
        >
          Card
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
                  color="#000000"
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
    </Box>
  );
};
