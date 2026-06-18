export const EXTERNAL_LINKS = {
  ESPACE_COLLABORATIF: 'https://espacecollaboratif.ign.fr/',
  GEOPF_SSO_RESET_CREDENTIALS:
    'https://sso.geopf.fr/realms/geoplateforme/login-actions/reset-credentials',
} as const;

/** URL de consultation d’un signalement sur l’Espace collaboratif (ex. …/georem/1150059). */
export function getGeoremReportUrl(reportId: number): string {
  const origin = EXTERNAL_LINKS.ESPACE_COLLABORATIF.replace(/\/$/, '');
  return `${origin}/georem/${reportId}`;
}
