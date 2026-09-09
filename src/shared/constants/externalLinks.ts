export const EXTERNAL_LINKS = {
  ESPACE_COLLABORATIF: 'https://espacecollaboratif.ign.fr/',
  GEOPF_SSO_RESET_CREDENTIALS:
    'https://sso.geopf.fr/realms/geoplateforme/login-actions/reset-credentials',
  GEOPF_SSO_ACCOUNT: 'https://sso.geopf.fr/realms/geoplateforme/account/',
  JE_DONNE_MON_AVIS: 'https://jedonnemonavis.numerique.gouv.fr/Demarches/4229?button=4930',
} as const;

/** URL de consultation d’un signalement sur l’Espace collaboratif (ex. …/georem/1150059). */
export function getGeoremReportUrl(reportId: number): string {
  const origin = EXTERNAL_LINKS.ESPACE_COLLABORATIF.replace(/\/$/, '');
  return `${origin}/georem/${reportId}`;
}

/** Console compte Géoplateforme, avec le client OAuth de l’app en référent. */
export function getGeopfSsoAccountUrl(clientId: string): string {
  const url = new URL(EXTERNAL_LINKS.GEOPF_SSO_ACCOUNT);
  const trimmed = clientId.trim();
  if (trimmed) {
    url.searchParams.set('client_id', trimmed);
  }
  return url.toString();
}
