import styles from './MapPointSheet.module.css';

export interface PartenaireSectionProps {
  name: string;
  /** URL du logo partenaire — zone placeholder si absent. */
  logoUrl?: string | null;
}

export function PartenaireSection({ name, logoUrl }: PartenaireSectionProps) {
  return (
    <section>
      <h3 className={styles.sectionTitle}>Partenaire</h3>
      <div className={styles.partnerCard}>
        <div className={styles.partnerLogoSlot} aria-label="Logo partenaire">
          {logoUrl ? (
            <img src={logoUrl} alt="" className={styles.partnerLogoImage} />
          ) : (
            <span className={styles.partnerLogoPlaceholder}>Logo</span>
          )}
        </div>
        <p className={styles.partnerName}>{name}</p>
      </div>
    </section>
  );
}
