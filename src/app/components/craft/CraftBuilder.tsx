"use client";

import { Editor, useEditor } from "@craftjs/core";
import {
  Box,
  Button,
  Paper,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

import { CraftButton } from "./CraftButton";
import { CraftCard } from "./CraftCard";
import { CraftContainer } from "./CraftContainer";
import { CraftEditorArea } from "./CraftEditorArea";
import { CraftSettingsPanel } from "./CraftSettingsPanel";
import { CraftText } from "./CraftText";
import { CraftToolbox } from "./CraftToolbox";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      paper: "#1e1e1e",
      default: "#121212",
    },
  },
});

export interface CraftBuilderProps {
  initialData?: string;
  onSave?: (data: string) => void;
}

// Topbar component that uses the Craft.js Editor context to extract serialized data
const BuilderTopbar = ({ onSave }: { onSave?: (data: string) => void }) => {
  const { query, canUndo, canRedo, actions } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        p: 2,
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Typography variant="h6" fontWeight="bold" sx={{ color: "white" }}>
        Page Builder
      </Typography>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={!canUndo}
            onClick={() => actions.history.undo()}
            sx={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "white",
              "&:hover": {
                borderColor: "white",
                background: "rgba(255,255,255,0.1)",
              },
              "&.Mui-disabled": {
                borderColor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)",
              },
            }}
          >
            Undo
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={!canRedo}
            onClick={() => actions.history.redo()}
            sx={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "white",
              "&:hover": {
                borderColor: "white",
                background: "rgba(255,255,255,0.1)",
              },
              "&.Mui-disabled": {
                borderColor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)",
              },
            }}
          >
            Redo
          </Button>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const json = query.serialize();
            if (onSave) {
              onSave(json);
            }
          }}
        >
          Save Layout
        </Button>
      </Box>
    </Box>
  );
};

export const CraftBuilder = ({ initialData, onSave }: CraftBuilderProps) => {
  return (
    <ThemeProvider theme={darkTheme}>
      {/* Initialize the Craft Editor and pass in the components it needs to know how to resolve */}
      <Editor
        resolver={{
          CraftContainer,
          CraftText,
          CraftButton,
          CraftCard,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <BuilderTopbar onSave={onSave} />

          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              width: "100%",
              overflowX: "auto",
              pb: 2,
            }}
          >
            {/* Left Sidebar - Toolbox */}
            <Paper
              elevation={0}
              sx={{
                width: 180,
                flexShrink: 0,
                borderRadius: "8px",
                overflow: "hidden",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "white",
              }}
            >
              <CraftToolbox />
            </Paper>

            {/* Center - Canvas */}
            <Box sx={{ flex: 1, minWidth: "300px" }}>
              <CraftEditorArea initialData={initialData} />
            </Box>

            {/* Right Sidebar - Settings */}
            <Paper
              elevation={0}
              sx={{
                width: 250,
                flexShrink: 0,
                borderRadius: "8px",
                overflow: "hidden",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "white",
              }}
            >
              <CraftSettingsPanel />
            </Paper>
          </Box>
        </Box>
      </Editor>
    </ThemeProvider>
  );
};
