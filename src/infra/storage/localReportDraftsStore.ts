import { Storage } from '@ign/mobile-device';

import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import { storageKey } from '@/shared/constants/storage';

const LOCAL_REPORT_DRAFTS_KEY = storageKey('LOCAL_REPORT_DRAFTS');

function isLocalReportDraft(value: unknown): value is LocalReportDraft {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Partial<LocalReportDraft>).id === 'string'
  );
}

export async function listLocalReportDrafts(): Promise<LocalReportDraft[]> {
  const stored = await Storage.get(LOCAL_REPORT_DRAFTS_KEY, 'array');
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.filter(isLocalReportDraft);
}

export async function getLocalReportDraft(id: string): Promise<LocalReportDraft | null> {
  const drafts = await listLocalReportDrafts();
  return drafts.find((draft) => draft.id === id) ?? null;
}

export async function saveLocalReportDraft(draft: LocalReportDraft): Promise<void> {
  const drafts = await listLocalReportDrafts();
  await Storage.set(LOCAL_REPORT_DRAFTS_KEY, [draft, ...drafts], 'array');
}

export async function deleteLocalReportDraft(id: string): Promise<void> {
  const drafts = await listLocalReportDrafts();
  await Storage.set(
    LOCAL_REPORT_DRAFTS_KEY,
    drafts.filter((draft) => draft.id !== id),
    'array',
  );
}
