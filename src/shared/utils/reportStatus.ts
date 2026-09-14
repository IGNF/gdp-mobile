import { ReportStatus } from '@ign/mobile-core';

const STATUS_COLOR_MAP: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: 'var(--color-warning)',
  [ReportStatus.Pending_Qualification]: 'var(--color-warning)',
  [ReportStatus.Pending_Entry]: 'var(--color-warning-shade)',
  [ReportStatus.Pending_Validation]: 'var(--color-warning-tint)',
  [ReportStatus.Valid]: 'var(--color-primary)',
  [ReportStatus.Valid_Already_Treated]: 'var(--color-primary-shade)',
  [ReportStatus.Reject]: 'var(--color-danger)',
  [ReportStatus.Reject_Irrelevant]: 'var(--color-danger-shade)',
  [ReportStatus.Submit]: 'var(--color-secondary)',
  [ReportStatus.Cluster]: 'var(--color-medium)',
  [ReportStatus.Draft]: 'var(--color-medium)',
};

const STATUS_COLOR_TOKEN_MAP: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: 'warning',
  [ReportStatus.Pending_Qualification]: 'warning',
  [ReportStatus.Pending_Entry]: 'warning-shade',
  [ReportStatus.Pending_Validation]: 'warning-tint',
  [ReportStatus.Valid]: 'primary',
  [ReportStatus.Valid_Already_Treated]: 'primary-shade',
  [ReportStatus.Reject]: 'danger',
  [ReportStatus.Reject_Irrelevant]: 'danger-shade',
  [ReportStatus.Submit]: 'secondary',
  [ReportStatus.Cluster]: 'medium',
  [ReportStatus.Draft]: 'medium',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.Draft]: 'Brouillon',
  [ReportStatus.Cluster]: 'Regroupé',
  [ReportStatus.Submit]: 'Soumis',
  [ReportStatus.Pending]: 'En attente',
  [ReportStatus.Pending_Qualification]: 'En qualification',
  [ReportStatus.Pending_Entry]: 'En saisie',
  [ReportStatus.Pending_Validation]: 'En validation',
  [ReportStatus.Valid]: 'Validé',
  [ReportStatus.Valid_Already_Treated]: 'Validé (déjà traité)',
  [ReportStatus.Reject]: 'Rejeté',
  [ReportStatus.Reject_Irrelevant]: 'Rejeté (non pertinent)',
};

export function getStatusColor(status: ReportStatus | string): string {
  return STATUS_COLOR_MAP[status as ReportStatus] ?? 'var(--color-medium)';
}

export function getStatusColorToken(status: ReportStatus | string): string {
  return STATUS_COLOR_TOKEN_MAP[status as ReportStatus] ?? 'medium';
}

export function getStatusLabel(status: ReportStatus | string): string {
  return STATUS_LABELS[status as ReportStatus] ?? status;
}

/**
 * Paire couleur/fond pour un badge de statut serveur, construite uniquement à partir de
 * tokens confirmés définis dans global.css (contrairement à STATUS_COLOR_MAP ci-dessus,
 * qui référence des tokens legacy non définis pour plusieurs statuts).
 */
const STATUS_BADGE_COLORS: Record<ReportStatus, { color: string; background: string }> = {
  [ReportStatus.Valid]: { color: 'var(--color-primary)', background: 'var(--color-bg-primary-subtle)' },
  [ReportStatus.Valid_Already_Treated]: {
    color: 'var(--color-primary)',
    background: 'var(--color-bg-primary-subtle)',
  },
  [ReportStatus.Reject]: { color: 'var(--color-danger)', background: 'rgba(var(--color-danger-rgb), 0.14)' },
  [ReportStatus.Reject_Irrelevant]: {
    color: 'var(--color-danger)',
    background: 'rgba(var(--color-danger-rgb), 0.14)',
  },
  [ReportStatus.Pending]: { color: 'var(--color-warning)', background: 'var(--color-bg-warning-subtle)' },
  [ReportStatus.Pending_Qualification]: {
    color: 'var(--color-warning)',
    background: 'var(--color-bg-warning-subtle)',
  },
  [ReportStatus.Pending_Entry]: {
    color: 'var(--color-warning)',
    background: 'var(--color-bg-warning-subtle)',
  },
  [ReportStatus.Pending_Validation]: {
    color: 'var(--color-warning)',
    background: 'var(--color-bg-warning-subtle)',
  },
  [ReportStatus.Submit]: { color: 'var(--color-text-secondary)', background: 'var(--color-bg-active)' },
  [ReportStatus.Cluster]: { color: 'var(--color-text-secondary)', background: 'var(--color-bg-active)' },
  [ReportStatus.Draft]: { color: 'var(--color-text-secondary)', background: 'var(--color-bg-active)' },
};

export function getStatusColors(status: ReportStatus | string): { color: string; background: string } {
  return (
    STATUS_BADGE_COLORS[status as ReportStatus] ?? {
      color: 'var(--color-text-secondary)',
      background: 'var(--color-bg-active)',
    }
  );
}
