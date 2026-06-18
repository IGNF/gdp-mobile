import type { ComponentType, CSSProperties, SVGProps } from 'react';

import { ReportStatus } from '@ign/mobile-core';

import { getStatusColor, getStatusLabel } from '@/shared/utils/reportStatus';

import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClock from '@/shared/assets/icons/icon-clock.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconPencil from '@/shared/assets/icons/icon-pencil.svg?react';
import IconSend from '@/shared/assets/icons/icon-send.svg?react';
import IconTag from '@/shared/assets/icons/icon-tag.svg?react';

import styles from './ReportStatusIcon.module.css';

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

function resolveStatusIcon(status: ReportStatus | string): SvgIcon {
  switch (status) {
    case ReportStatus.Valid:
    case ReportStatus.Valid_Already_Treated:
      return IconCheck;
    case ReportStatus.Reject:
    case ReportStatus.Reject_Irrelevant:
      return IconClose;
    case ReportStatus.Submit:
      return IconSend;
    case ReportStatus.Draft:
      return IconPencil;
    case ReportStatus.Cluster:
      return IconTag;
    case ReportStatus.Pending:
    case ReportStatus.Pending_Qualification:
    case ReportStatus.Pending_Entry:
    case ReportStatus.Pending_Validation:
    default:
      return IconClock;
  }
}

export interface ReportStatusIconProps {
  status: ReportStatus | string;
  className?: string;
}

export function ReportStatusIcon({ status, className }: ReportStatusIconProps) {
  const Icon = resolveStatusIcon(status);
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={`${styles.wrapper} ${className ?? ''}`}
      style={
        {
          color,
          '--status-icon-bg': `color-mix(in srgb, ${color} 18%, transparent)`,
        } as CSSProperties
      }
      title={label}
      aria-label={`Statut : ${label}`}
    >
      <Icon className={styles.icon} aria-hidden />
    </span>
  );
}
