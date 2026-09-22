import { ReportStatus } from '@ign/mobile-core';

/**
 * Regroupement à 3 états du statut serveur détaillé (`ReportStatus`), pour le badge
 * d'instruction affiché sur un signalement déjà envoyé (badge « Envoyé » séparé, voir
 * `localReportDraftStatus.ts`) : reçu (en cours d'instruction), pris en compte, rejeté.
 */
export type ReportInstructionStatusBucket = 'pending' | 'accepted' | 'rejected';

const BUCKET_BY_STATUS: Record<ReportStatus, ReportInstructionStatusBucket> = {
  [ReportStatus.Draft]: 'pending',
  [ReportStatus.Cluster]: 'pending',
  [ReportStatus.Submit]: 'pending',
  [ReportStatus.Pending]: 'pending',
  [ReportStatus.Pending_Qualification]: 'pending',
  [ReportStatus.Pending_Entry]: 'pending',
  [ReportStatus.Pending_Validation]: 'pending',
  [ReportStatus.Valid]: 'accepted',
  [ReportStatus.Valid_Already_Treated]: 'accepted',
  [ReportStatus.Reject]: 'rejected',
  [ReportStatus.Reject_Irrelevant]: 'rejected',
};

const BUCKET_LABELS: Record<ReportInstructionStatusBucket, string> = {
  pending: 'Reçu',
  accepted: 'Pris en compte',
  rejected: 'Rejeté',
};

const BUCKET_COLORS: Record<ReportInstructionStatusBucket, { color: string; background: string }> = {
  pending: { color: 'var(--color-text-secondary)', background: 'var(--color-bg-active)' },
  accepted: { color: 'var(--color-primary)', background: 'var(--color-bg-primary-subtle)' },
  rejected: { color: 'var(--color-danger)', background: 'rgba(var(--color-danger-rgb), 0.14)' },
};

export function getReportInstructionStatusBucket(
  status: ReportStatus | string,
): ReportInstructionStatusBucket {
  return BUCKET_BY_STATUS[status as ReportStatus] ?? 'pending';
}

export function getReportInstructionStatusLabel(status: ReportStatus | string): string {
  return BUCKET_LABELS[getReportInstructionStatusBucket(status)];
}

export function getReportInstructionStatusColors(
  status: ReportStatus | string,
): { color: string; background: string } {
  return BUCKET_COLORS[getReportInstructionStatusBucket(status)];
}
