import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface UseDialogFocusOptions {
  canClose: boolean;
  onClose: () => void;
}

export function useDialogFocus({ canClose, onClose }: UseDialogFocusOptions) {
  const dialogRef = useRef<HTMLElement>(null);
  const canCloseRef = useRef(canClose);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    canCloseRef.current = canClose;
  }, [canClose]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const originalOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    function getFocusableElements(): HTMLElement[] {
      if (!dialog) return [];
      return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && canCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (!focusableElements.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!dialog?.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    const animationFrame = window.requestAnimationFrame(() => {
      if (dialog?.contains(document.activeElement)) return;

      const autofocusElement = dialog?.querySelector<HTMLElement>("[autofocus]");
      (autofocusElement ?? getFocusableElements()[0] ?? dialog)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  return dialogRef;
}
