import {
  NON_CONFORM_REASON_LABELS,
  type NonConformReason,
} from '@/features/report/components/GeodesyPointReportWizard/ReportWizardStepNonConformReason';

/** Valeurs liste EspaceCo / codes RN (`rn_etat_code`). */
const ETAT_BY_NON_CONFORM_REASON: Partial<Record<NonConformReason, string>> = {
  mauvaisEtat: 'MAUVAIS ETAT',
  detruit: 'DETRUIT',
  nonRetrouve: 'NON RETROUVE',
  malPositionne: 'PRESUME DEPLACE',
};

const EXCLUSIVE_ETAT_REASONS: readonly NonConformReason[] = [
  'nonRetrouve',
  'detruit',
  'mauvaisEtat',
];

const COMMENT_ONLY_REASONS: readonly NonConformReason[] = ['photoNonConforme'];

/** Valeur `etat` du thème `gdp-tools` d’après le wizard. */
export function resolveGdpReportEtatValue(params: {
  isConform: boolean;
  nonConformReasons: readonly NonConformReason[];
}): string | undefined {
  if (params.isConform) {
    return 'BON ETAT';
  }

  for (const reason of EXCLUSIVE_ETAT_REASONS) {
    if (params.nonConformReasons.includes(reason)) {
      return ETAT_BY_NON_CONFORM_REASON[reason];
    }
  }

  if (params.nonConformReasons.includes('malPositionne')) {
    return ETAT_BY_NON_CONFORM_REASON.malPositionne;
  }

  return undefined;
}

/** Saisie wizard → champs thème canoniques (`etat`, `move` ; `gps` reste prérempli WFS). */
export function buildGdpWizardThemeFormAttributes(params: {
  isConform: boolean;
  nonConformReasons: readonly NonConformReason[];
  extraThemeAttributes?: Record<string, string>;
  positionModified?: boolean;
}): Record<string, string> {
  const attributes: Record<string, string> = { ...params.extraThemeAttributes };
  const etat = resolveGdpReportEtatValue(params);
  if (etat) {
    attributes.etat = etat;
  }
  attributes.move = params.positionModified ? 'true' : 'false';

  return attributes;
}

/** Ajoute au commentaire les motifs wizard qui ne sont pas le champ `etat`. */
export function buildGdpWizardComment(
  userComment: string,
  nonConformReasons: readonly NonConformReason[],
): string {
  const extras = COMMENT_ONLY_REASONS.filter((reason) => nonConformReasons.includes(reason)).map(
    (reason) => NON_CONFORM_REASON_LABELS[reason],
  );
  const trimmed = userComment.trim();
  if (extras.length === 0) {
    return trimmed;
  }

  const extraBlock = extras.join('\n');
  return trimmed ? `${trimmed}\n\n${extraBlock}` : extraBlock;
}
