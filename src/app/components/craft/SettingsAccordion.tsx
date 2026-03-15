"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import { useEffect, useState } from "react";

export interface SettingsAccordionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const SettingsAccordion = ({
  title,
  defaultExpanded = true,
  children,
}: SettingsAccordionProps) => {
  const storageKey = `craft-accordion-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setExpanded(stored === "true");
    }
  }, [storageKey]);

  const handleChange = (_e: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
    localStorage.setItem(storageKey, String(isExpanded));
  };

  if (!mounted) {
    return null; // prevent hydration mismatch
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={handleChange}
      disableGutters
      sx={{
        background: "transparent",
        boxShadow: "none",
        "&:before": { display: "none" },
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
        sx={{ px: 0, minHeight: "40px", "& .MuiAccordionSummary-content": { my: 1 } }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, pb: 2, display: "flex", flexDirection: "column", gap: 3 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
};
