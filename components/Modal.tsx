"use client";

import React, { ReactNode } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}

/**
 * Material-UI Dialog Component Wrapper
 * Provides consistent API for modals/dialogs across the application
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "md",
  fullWidth = true,
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: "8px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.16)",
        },
      }}
    >
      {title && <DialogTitle sx={{ fontSize: "1.25rem", fontWeight: 600 }}>{title}</DialogTitle>}
      <DialogContent sx={{ py: 2 }}>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}

export default Modal;
