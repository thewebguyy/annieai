// Architectural Layer: Component / Utility
// Dependencies: sonner

import { toast as sonnerToast } from "sonner";

export const toast = {
  success(message: string, description?: string): void {
    sonnerToast.success(message, { description });
  },
  
  error(message: string, description?: string): void {
    sonnerToast.error(message, { description });
  },
  
  info(message: string, description?: string): void {
    sonnerToast.info(message, { description });
  },
  
  warning(message: string, description?: string): void {
    sonnerToast.warning(message, { description });
  },
  
  loading(message: string): string | number {
    return sonnerToast.loading(message);
  },
  
  dismiss(id?: string | number): void {
    sonnerToast.dismiss(id);
  },
};
