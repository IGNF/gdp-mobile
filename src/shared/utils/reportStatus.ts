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
