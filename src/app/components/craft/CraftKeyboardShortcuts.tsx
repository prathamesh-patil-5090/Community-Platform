"use client";

import { useEditor } from "@craftjs/core";
import { useEffect } from "react";

export const CraftKeyboardShortcuts = () => {
  const { selectedNodeId, actions, query, canUndo, canRedo } = useEditor((state, query) => {
    const [selected] = state.events.selected;
    return {
      selectedNodeId: selected,
      canUndo: query.history.canUndo(),
      canRedo: query.history.canRedo(),
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) actions.history.redo();
        } else {
          if (canUndo) actions.history.undo();
        }
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (canRedo) actions.history.redo();
        return;
      }

      // Arrow navigation
      if (
        selectedNodeId &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        try {
          const node = query.node(selectedNodeId).get();
          if (!node) return;

          if (e.key === "ArrowUp") {
            if (node.data.parent) {
              actions.selectNode(node.data.parent);
            }
          } else if (e.key === "ArrowDown") {
            if (node.data.nodes && node.data.nodes.length > 0) {
              actions.selectNode(node.data.nodes[0]);
            } else if (node.data.linkedNodes) {
              const linked = Object.values(node.data.linkedNodes);
              if (linked.length > 0) actions.selectNode(linked[0]);
            }
          } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            if (node.data.parent) {
              const parent = query.node(node.data.parent).get();
              if (parent && parent.data.nodes) {
                const siblings = parent.data.nodes;
                const index = siblings.indexOf(selectedNodeId);
                if (e.key === "ArrowLeft" && index > 0) {
                  actions.selectNode(siblings[index - 1]);
                } else if (e.key === "ArrowRight" && index < siblings.length - 1) {
                  actions.selectNode(siblings[index + 1]);
                }
              }
            }
          }
        } catch {
          // Node not found or other errors
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, actions, query, canUndo, canRedo]);

  return null;
};
