import { usePartnerLogo } from '@/features/map/hooks/usePartnerLogo';

import styles from './MapPointSheet.module.css';

export interface PartenaireSectionProps {
  name: string;
  /** Identifiant du partenaire (proprio_id) pour charger le logo depuis le cache. */
  partnerId?: string | null;
}

export function PartenaireSection({ name, partnerId }: PartenaireSectionProps) {
  const { logoUrl } = usePartnerLogo(partnerId);

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
