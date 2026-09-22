import IconAlertCircle from '@/shared/assets/icons/icon-alert-circle.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconInfo from '@/shared/assets/icons/icon-info.svg?react';
import type { GdpNewsSeverity } from '@/domain/news/models';

export interface NewsSeverityVisual {
  Icon: typeof IconInfo;
  background: string;
  color: string;
}

export const NEWS_SEVERITY_VISUALS: Record<GdpNewsSeverity, NewsSeverityVisual> = {
  info: {
    Icon: IconInfo,
    background: 'var(--figma-blue-2)',
    color: 'var(--figma-blue-5)',
  },
  warning: {
    Icon: IconAlertCircle,
    background: 'var(--color-bg-warning-subtle)',
    color: 'var(--color-warning-emphasis)',
  },
  error: {
    Icon: IconClose,
    background: 'rgba(var(--color-danger-rgb), 0.14)',
    color: 'var(--color-danger)',
  },
};
