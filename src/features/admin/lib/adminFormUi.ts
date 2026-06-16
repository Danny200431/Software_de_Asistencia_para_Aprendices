import type { CSSProperties } from "react";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

export function focusFirstInvalidField() {
  document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
}

export function fieldInputClass(
  hasError: boolean,
  base: string,
  invalidClass = styles.inputInvalid
): string {
  return hasError ? `${base} ${invalidClass}` : base;
}

export function readOnlyFieldStyle(): CSSProperties {
  return {
    margin: 0,
    minHeight: "2.5rem",
    display: "flex",
    alignItems: "center"
  };
}
