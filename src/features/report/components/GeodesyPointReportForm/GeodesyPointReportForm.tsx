import { GEODESY_POINT_REPORT_PHOTO_SLOTS } from '@ign/gdp-tools';
import { GeodesyPointDetails, GeodesyPointTitle } from '@ign/gdp-tools/react';
import type { GeodesyPointReportContext } from '@ign/gdp-tools';
import { useMemo, useState } from 'react';

import { GEODESY_REPORT_THEME } from '@/features/report/constants/geodesyReportApi';
import { GDP_REPORT_COMMUNITY_ID } from '@/features/report/constants/reportApi';
import { useGdpCommunityThemes } from '@/features/report/hooks/useGdpCommunityThemes';
import { Loading } from '@/shared/ui/Loading';
import { listGdpCommunityThemeNamesFromConfigs } from '@/features/report/utils/communityReportTheme';
import { formatGeodesyThemeLookupHint } from '@/features/report/utils/geodesyReportTheme';

import { AttachmentSection } from '@/features/report/components/AttachmentSection';
import { BoundaryReportThemeField } from '@/features/report/components/BoundaryReportThemeField';
import { ReportPhotoSlot } from '@/features/report/components/ReportPhotoSlot';
import { ReportPositionMap } from '@/features/report/components/ReportPositionMap';
import type { UseGeodesyPointReportFormReturn } from '@/features/report/hooks/useGeodesyPointReportForm';

import IconCamera from '@/shared/assets/icons/icon-camera.svg?react';

import inputs from '@/shared/styles/inputs.module.css';
import boundaryFormStyles from '@/features/report/components/BoundaryReportForm/BoundaryReportForm.module.css';

import styles from './GeodesyPointReportForm.module.css';

const POINT_ATTRIBUTES_PREVIEW_COUNT = 6;

interface GeodesyPointReportFormProps {
  reportContext: GeodesyPointReportContext;
  form: UseGeodesyPointReportFormReturn;
}

export function GeodesyPointReportForm({ reportContext, form }: GeodesyPointReportFormProps) {
  const { themes, isLoading: isThemesLoading } = useGdpCommunityThemes();
  const communityThemeNames = useMemo(
    () => listGdpCommunityThemeNamesFromConfigs(themes),
    [themes],
  );
  const [showAllPointAttributes, setShowAllPointAttributes] = useState(false);
  const photo1Slot = GEODESY_POINT_REPORT_PHOTO_SLOTS[0];
  const photo2Slot = GEODESY_POINT_REPORT_PHOTO_SLOTS[1];
  const photoCount = Number(Boolean(form.photo1)) + Number(Boolean(form.photo2));

  const visiblePointAttributes = useMemo(() => {
    if (showAllPointAttributes) {
      return reportContext.attributes;
    }

    return reportContext.attributes.slice(0, POINT_ATTRIBUTES_PREVIEW_COUNT);
  }, [reportContext.attributes, showAllPointAttributes]);

  const hiddenPointAttributesCount = Math.max(
    0,
    reportContext.attributes.length - POINT_ATTRIBUTES_PREVIEW_COUNT,
  );

  const renderLabel = (text: string, required?: boolean, htmlFor?: string) => (
    <label className={inputs.label} htmlFor={htmlFor}>
      {text}
      {required && <span className={inputs.required}> *</span>}
    </label>
  );

  const resolvedThemeName = form.theme?.theme ?? GEODESY_REPORT_THEME;

  return (
    <div className={boundaryFormStyles.form}>
      {isThemesLoading ? (
        <div className={styles.themeHintShort}>
          <Loading size="small" label="Chargement du thème collaboratif…" />
        </div>
      ) : form.isThemeConfigured ? (
        <div className={styles.themeBadge}>
          Thème collaboratif : <strong>{resolvedThemeName}</strong>
        </div>
      ) : (
        <div className={styles.themeHintShort}>
          Thème « {GEODESY_REPORT_THEME} » non chargé depuis la communauté {GDP_REPORT_COMMUNITY_ID}.{' '}
          {formatGeodesyThemeLookupHint(communityThemeNames)}
        </div>
      )}

      <section className={boundaryFormStyles.section}>
        <h2 className={boundaryFormStyles.sectionLabel}>Point géodésique</h2>
        <article className={styles.pointCard}>
          <header className={styles.pointCardHeader}>
            <div className={styles.pointTitle}>
              <GeodesyPointTitle
                title={reportContext.title}
                picto={reportContext.titlePicto}
              />
            </div>
            <p className={styles.pointMeta}>
              {reportContext.layerTitle}
              {!form.canEditPosition ? (
                <>
                  {' · '}
                  {reportContext.latitude.toFixed(5)}° N, {reportContext.longitude.toFixed(5)}° E
                </>
              ) : null}
            </p>
          </header>

          {reportContext.attributes.length > 0 ? (
            <>
              <GeodesyPointDetails
                layerTitle={reportContext.layerTitle}
                longitude={reportContext.longitude}
                latitude={reportContext.latitude}
                attributes={visiblePointAttributes}
                showMeta={false}
              />
              {hiddenPointAttributesCount > 0 ? (
                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={() => setShowAllPointAttributes((current) => !current)}
                  aria-expanded={showAllPointAttributes}
                >
                  {showAllPointAttributes
                    ? 'Afficher moins'
                    : `Afficher ${hiddenPointAttributesCount} attribut${hiddenPointAttributesCount > 1 ? 's' : ''} de plus`}
                </button>
              ) : null}
            </>
          ) : (
            <p className={styles.pointMeta}>Aucun attribut disponible pour ce repère.</p>
          )}
        </article>
      </section>

      {form.canEditPosition ? (
        <section className={boundaryFormStyles.section}>
          <h2 className={boundaryFormStyles.sectionLabel}>Position du signalement</h2>
          <ReportPositionMap
            longitude={form.longitude}
            latitude={form.latitude}
            initialLongitude={form.initialPosition.longitude}
            initialLatitude={form.initialPosition.latitude}
            canResetPosition={form.canResetPosition}
            onPositionChange={form.setPosition}
            onResetPosition={form.resetPositionToInitial}
          />
        </section>
      ) : null}

      {form.themeFieldDefinitions.length > 0 ? (
        <section className={boundaryFormStyles.section}>
          <h2 className={boundaryFormStyles.sectionLabel}>Signalement</h2>
          <div className={boundaryFormStyles.fieldGroup}>
            {form.themeFieldDefinitions.map((attribute) => (
              <BoundaryReportThemeField
                key={attribute.name}
                attribute={attribute}
                value={form.themeAttributes[attribute.name] ?? ''}
                error={form.errors.themeAttributes?.[attribute.name]}
                onChange={(value) => form.setThemeAttribute(attribute.name, value)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {photo1Slot ? (
        <section className={boundaryFormStyles.section}>
          <AttachmentSection
            Icon={IconCamera}
            label="Photos"
            badge={`${photoCount}/2`}
            hasContent={photoCount > 0}
            emptyText="Photo du repère (obligatoire) et vue complémentaire si besoin."
            defaultExpanded
          >
            <div className={boundaryFormStyles.photoGrid}>
              <ReportPhotoSlot
                label={photo1Slot.label}
                helper={photo1Slot.mandatory ? 'Obligatoire' : ''}
                photo={form.photo1}
                error={form.errors.photo1}
                onSelectFile={async (file) => {
                  form.setPhotoForRole('photo1', file);
                }}
              />
              {photo2Slot ? (
                <ReportPhotoSlot
                  label={photo2Slot.label}
                  helper="Optionnelle"
                  photo={form.photo2}
                  onSelectFile={async (file) => {
                    form.setPhotoForRole('photo2', file);
                  }}
                />
              ) : null}
            </div>
          </AttachmentSection>
        </section>
      ) : null}

      <section className={boundaryFormStyles.section}>
        <h2 className={boundaryFormStyles.sectionLabel}>Autres informations</h2>
        <div className={inputs.field}>
          {renderLabel('Commentaire', false, 'geodesy-report-comment')}
          <textarea
            id="geodesy-report-comment"
            className={inputs.textarea}
            rows={4}
            value={form.comment}
            onChange={(event) => form.setComment(event.target.value)}
            placeholder="Précisions utiles : accès, travaux, état observé sur le terrain, etc."
          />
        </div>
      </section>
    </div>
  );
}
