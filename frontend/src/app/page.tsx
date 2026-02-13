import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>دندوش ♡ دندوشة</h1>
        <p className={styles.subtitle}>فضاءٌ رقمي يجمع روحين</p>
      </div>

      <div className={styles.buttons}>
        <Link href="/dandouch" className={styles.glassButton}>
          <span className={styles.buttonLabel}>دندوش</span>
          <span className={styles.buttonHint}>ادخل عالمنا</span>
        </Link>

        <Link href="/dandoucha" className={styles.glassButton}>
          <span className={styles.buttonLabel}>دندوشة</span>
          <span className={styles.buttonHint}>ادخلي عالمنا</span>
        </Link>
      </div>

      <p className={styles.date}>منذ ١٥ سبتمبر ٢٠٢٥</p>
    </div>
  );
}
