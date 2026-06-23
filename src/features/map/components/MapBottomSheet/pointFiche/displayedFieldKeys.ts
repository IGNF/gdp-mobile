/** Champs consommés par l'en-tête commun (hors corps de fiche). */
export const POINT_FICHE_HEADER_FIELD_KEYS = ['etat', 'ETAT', 'vis_date', 'VIS_DATE'] as const;

export const GEODESY_FICHE_SNAP1_FIELD_KEYS = [
  'img1_url',
  'img2_url',
  'groupe_img1_url',
  'groupe_croquis1_url',
  'nom',
  'no',
  'id',
  'localisation',
  'expl_gps',
  'EXPL_GPS',
  'expl_gpscode',
] as const;

export const GEODESY_FICHE_SNAP2_FIELD_KEYS = [
  'commune',
  'groupe_type',
  'type',
  'url_pdf',
  'maj_date',
  'comment',
  'proprio',
  'proprio_logo',
  'cg1_coord1',
  'cg1_coord1_dms',
  'cg1_coord2',
  'cg1_coord2_dms',
  'cg1_coord3',
  'cg1_srt',
  'cg1_ell',
  'ellipsoide',
  'cp1_coord1',
  'cp1_coord2',
  'cp1_coord3',
  'cp1_srt',
  'cp1_prec',
  'cp1_srv',
  'cp1_precv',
] as const;

export const NIVELLEMENT_FICHE_SNAP1_FIELD_KEYS = [
  'img1_url',
  'img2_url',
  'groupe_img1_url',
  'groupe_croquis1_url',
  'type',
  'altitude',
  'alt',
  'complement',
  'sys_alt',
  'systeme_altitude',
  'commune',
  'nom',
  'no',
  'id',
] as const;

export const NIVELLEMENT_FICHE_SNAP2_FIELD_KEYS = ['comment', 'url_pdf', 'maj_date', 'localisation'] as const;
