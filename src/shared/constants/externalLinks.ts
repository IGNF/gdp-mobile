export const EXTERNAL_LINKS = {
  ESPACE_COLLABORATIF: 'https://espacecollaboratif.ign.fr/',
  ESPACE_COLLABORATIF_PROFILE: 'https://espacecollaboratif.ign.fr/profile/',
  GEOPF_SSO_RESET_CREDENTIALS:
    'https://sso.geopf.fr/realms/geoplateforme/login-actions/reset-credentials',
  GEOPF_SSO_ACCOUNT: 'https://sso.geopf.fr/realms/geoplateforme/account/',
 
  JE_DONNE_MON_AVIS: 'https://jedonnemonavis.numerique.gouv.fr/Demarches/4229?button=4930',
  AIDE_GUIDE_UTILISATEUR: 'https://geodesie.ign.fr/geodesie-de-poche',
  FAQ_FORUM: 'https://forum.geocommuns.fr/t/a-propos-de-la-categorie-geodesie-de-poche/3287',
  NOUS_ECRIRE: 'https://forum.geocommuns.fr/t/a-propos-de-la-categorie-geodesie-de-poche/3287',
  MENTIONS_LEGALLES: 'https://www.ign.fr/institut/mentions-legales',
  CONDITIONS_UTILISATION: 'https://www.ign.fr/institut/conditions-utilisation',
  DONNEES_PERSONNELLES: 'https://www.ign.fr/institut/politique-de-confidentialite-donnees-caractere-personnel-collectees-par-lapplication-cartes-ign',
  ACCESSIBILITE: 'https://www.ign.fr/declaration-daccessibilite-rgaa',
  CODE_SOURCE: 'https://github.com/IGNF/gdp-mobile',
  LICENCES_OPENSOURCE: 'https://github.com/IGNF/gdp-mobile/blob/main/prod-dependencies.md',
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
