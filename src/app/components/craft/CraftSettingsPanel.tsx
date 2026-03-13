"use client";

import { useEditor } from "@craftjs/core";
import { Box, Button, Chip, Divider, Typography } from "@mui/material";
import React from "react";

export const CraftSettingsPanel = () => {
  const { selected, actions } = useEditor((state, query) => {
    const currentNodeId = query.getEvent("selected").first();
    let selectedNode;

    if (currentNodeId) {
      selectedNode = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }

    return {
      selected: selectedNode,
    };
  });

  return (
    <Box sx={{ p: 1.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.5,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          Properties
        </Typography>
        {selected && (
          <Chip
            label={selected.name}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>
      <Divider sx={{ mb: 1.5 }} />

      {selected ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {selected.settings ? (
            React.createElement(selected.settings)
          ) : (
            <Typography variant="body2" color="text.secondary">
              No properties available for this component.
            </Typography>
          )}

          {selected.isDeletable && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                actions.delete(selected.id);
              }}
              sx={{ mt: 1 }}
            >
              Delete Component
            </Button>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Click on a component to edit its properties.
        </Typography>
      )}
    </Box>
  );
};
