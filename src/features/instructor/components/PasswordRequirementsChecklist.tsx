import { PASSWORD_RULES } from "@/src/lib/validatePassword";
import styles from "./PasswordRequirementsChecklist.module.css";

type Props = {
  password: string;
  id?: string;
  open: boolean;
};

export function PasswordRequirementsChecklist({ password, id, open }: Props) {
  if (!open) return null;

  return (
    <div id={id} className={styles.popover} role="tooltip">
      <p className={styles.title}>La contraseña debe tener:</p>
      <ul className={styles.list} aria-label="Requisitos de la contraseña">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.id} className={`${styles.item} ${met ? styles.itemMet : ""}`}>
              <span className={styles.icon} aria-hidden="true">
                {met ? "✓" : "○"}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
