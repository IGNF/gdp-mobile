export const EXTERNAL_LINKS = {
  ESPACE_COLLABORATIF: 'https://espacecollaboratif.ign.fr/',
  ESPACE_COLLABORATIF_PROFILE: 'https://espacecollaboratif.ign.fr/profile/',
  GEOPF_SSO_RESET_CREDENTIALS:
    'https://sso.geopf.fr/realms/geoplateforme/login-actions/reset-credentials',
  GEOPF_SSO_ACCOUNT: 'https://sso.geopf.fr/realms/geoplateforme/account/',
  JE_DONNE_MON_AVIS: 'https://jedonnemonavis.numerique.gouv.fr/Demarches/4229?button=4930',
} as const;



/** Console compte Géoplateforme, avec le client OAuth de l’app en référent. */
export function getGeopfSsoAccountUrl(clientId: string): string {
  const url = new URL(EXTERNAL_LINKS.GEOPF_SSO_ACCOUNT);
  const trimmed = clientId.trim();
  if (trimmed) {
    url.searchParams.set('client_id', trimmed);
  }
  return url.toString();
}
