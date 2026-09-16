import type { ReactNode } from 'react';
import { GEODESY_GDP_PICTO_URLS } from '@ign/gdp-tools';

import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';

import styles from './LegendPage.module.css';

export interface LegendPageProps {
  isOpen: boolean;
  onClose: () => void;
}

function LegendDot({ color }: { color: string }) {
  return (
    <span className={styles.rowIcon}>
      <span className={styles.dot} style={{ background: color }} />
    </span>
  );
}

/** Symbole IGN réel (même picto que sur la carte, flux WFS géodésie). */
function LegendPicto({ pictoCode }: { pictoCode: keyof typeof GEODESY_GDP_PICTO_URLS }) {
  return (
    <span className={styles.rowIcon}>
      <img src={GEODESY_GDP_PICTO_URLS[pictoCode]} alt="" className={styles.pictoImage} />
    </span>
  );
}

function LegendPin({ color }: { color: string }) {
  return (
    <span className={styles.rowIcon}>
      <svg width="20" height="26" viewBox="0 0 36 48" aria-hidden>
        <path
          d="M18 46 C18 46 4 30.5 4 18 A14 14 0 1 1 32 18 C32 30.5 18 46 18 46 Z"
          fill={color}
        />
        <circle cx="18" cy="17.5" r="9.5" fill="#ffffff" />
      </svg>
    </span>
  );
}

interface LegendRow {
  label: string;
  swatch: ReactNode;
}

function LegendSection({ title, rows }: { title: string; rows: LegendRow[] }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {rows.map((row) => (
        <div className={styles.row} key={row.label}>
          {row.swatch}
          <span className={styles.rowLabel}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LegendPage({ isOpen, onClose }: LegendPageProps) {
  return (
    <MapOverlaySheet isOpen={isOpen} onClose={onClose} titleAlign="left" title="Légende" ariaLabel="Légende">
      <main className={styles.content}>
        <LegendSection
          title="Repère de nivellement (RN)"
          rows={[
            { label: 'Repère IGN exploitable', swatch: <LegendPicto pictoCode="PT_RN_GOOD" /> },
            { label: 'Repère IGN d’un triplet', swatch: <LegendPicto pictoCode="PT_RN_TRIPLET_GOOD" /> },
            { label: 'Repère partenaire exploitable', swatch: <LegendPicto pictoCode="PT_RN_CANEX_GOOD" /> },
            { label: 'Repère exploitable sous réserve', swatch: <LegendPicto pictoCode="PT_RN_BAD" /> },
          ]}
        />

        <LegendSection
          title="Site géodésique"
          rows={[
            { label: 'Site de base', swatch: <LegendPicto pictoCode="PT_RBF_GOOD" /> },
            { label: 'Site de détail', swatch: <LegendPicto pictoCode="PT_RDF_GOOD" /> },
            { label: 'Site partenaire', swatch: <LegendPicto pictoCode="PT_RDF_CANEX_GOOD" /> },
            { label: 'Site en mauvais état', swatch: <LegendPicto pictoCode="PT_RBF_BAD" /> },
          ]}
        />

        <LegendSection
          title="Réseau GNSS permanent"
          rows={[
            { label: 'Station opérationnelle', swatch: <LegendDot color="#26a581" /> },
            { label: 'Station opérationnelle, données en attente', swatch: <LegendDot color="#f18345" /> },
            { label: 'Données manquantes', swatch: <LegendDot color="#e86f4a" /> },
            { label: 'Station en panne', swatch: <LegendDot color="#6c6661" /> },
          ]}
        />

        <LegendSection
          title="Signalements"
          rows={[
            {
              label: 'Signalement enregistré (pas encore envoyé au serveur)',
              swatch: <LegendPin color="var(--color-navy)" />,
            },
            { label: 'Signalement envoyé au serveur', swatch: <LegendPin color="var(--color-text-secondary)" /> },
            {
              label: 'Signalement en cours de traitement ou en attente de saisie',
              swatch: <LegendPin color="var(--color-warning)" />,
            },
            { label: 'Signalement pris en compte', swatch: <LegendPin color="var(--color-primary)" /> },
            { label: 'Signalement rejeté par nos services', swatch: <LegendPin color="var(--color-danger)" /> },
          ]}
        />
      </main>
    </MapOverlaySheet>
  );
}
