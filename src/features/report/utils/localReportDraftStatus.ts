import type { LocalReportDraftStatus } from '@/domain/report/localReportDraft';

const STATUS_LABELS: Record<LocalReportDraftStatus, string> = {
  not_sent: 'Pas envoyé',
  sent: 'Envoyé',
};

const STATUS_COLORS: Record<LocalReportDraftStatus, { color: string; background: string }> = {
  not_sent: { color: 'var(--color-navy)', background: 'var(--color-bg-navy-subtle)' },
  sent: { color: 'var(--color-primary)', background: 'var(--color-bg-primary-subtle)' },
};

const STATUS_ACCENT_RGB: Record<LocalReportDraftStatus, string> = {
  not_sent: 'var(--color-navy-rgb)',
  sent: 'var(--color-action-primary-rgb)',
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

export function getLocalReportDraftStatusAccentRgb(status: LocalReportDraftStatus): string {
  return STATUS_ACCENT_RGB[status];
}
