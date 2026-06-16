import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

export function AdminFieldError({ id, message }: { id: string; message?: string }) {
  return (
    <div className={styles.fieldErrorSlot}>
      {message ? (
        <p id={id} className={styles.fieldError} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
