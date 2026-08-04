import type { LocalReportDraftStatus } from '@/domain/report/localReportDraft';

const STATUS_LABELS: Record<LocalReportDraftStatus, string> = {
  not_sent: 'Pas envoyé',
  taken_into_account: 'Pris en compte',
  rejected: 'Rejeté',
};

const STATUS_COLORS: Record<LocalReportDraftStatus, { color: string; background: string }> = {
  not_sent: { color: 'var(--color-secondary)', background: 'var(--color-secondary-light)' },
  taken_into_account: { color: 'var(--color-primary-shade)', background: 'var(--color-primary-light)' },
  rejected: { color: 'var(--color-danger-shade)', background: 'rgba(var(--color-danger-rgb), 0.14)' },
};

export function getLocalReportDraftStatusLabel(status: LocalReportDraftStatus): string {
  return STATUS_LABELS[status];
}

export function getLocalReportDraftStatusColors(status: LocalReportDraftStatus): {
  color: string;
  background: string;
} {
  return STATUS_COLORS[status];
}
