import { useState } from 'react';

import { AppLogo } from '@/shared/ui/AppLogo';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { TrackedExternalLink } from '@/infra/analytics/TrackedExternalLink';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconExternalLink from '@/shared/assets/icons/icon-external-link.svg?react';

import screen from '@/shared/styles/screen.module.css';
import styles from './AboutPage.module.css';

function aboutTracking(label: string) {
  return { context: 'À propos', label };
}

export interface AboutPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutPage({ isOpen, onClose }: AboutPageProps) {
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  if (!isOpen && isLegalOpen) {
    setIsLegalOpen(false);
  }

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="À propos" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose} />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <AppLogo size="sm" className={styles.logo} />
        <p className={styles.titleAPropos}>Géodésie de poche</p>
        <p className={styles.version}>Version {__APP_VERSION__}</p>

        <section className={styles.section}>
            <div className={styles.sectionTitle}>Notre mission</div>
            <div>
            Cette application permet de consulter la cartographie IGN, les repères géodésiques
            et de signaler leur état sur le terrain.
          </div>
          <div>
            Éditée par l’
            <TrackedExternalLink href="https://www.ign.fr/" tracking={aboutTracking('Site IGN')}>
              Institut national de l’information géographique et forestière
            </TrackedExternalLink>
          </div>
        </section>
        <div className={styles.sectionTitle}>Liens utiles</div>
        <section className={styles.section}>
          <article className={styles.legal}>
            <button
              type="button"
              className={styles.legalTrigger}
              aria-expanded={isLegalOpen}
              onClick={() => setIsLegalOpen((open) => !open)}
            >
              <span className={styles.legalLabel}>Mentions légales</span>
              {isLegalOpen ? (
                <span className={styles.legalClose}>
                  <IconClose className={styles.legalIcon} aria-hidden />
                </span>
              ) : (
                <span className={styles.legalPlus} aria-hidden>
                  +
                </span>
              )}
            </button>
            {isLegalOpen ? (
              <div className={styles.legalPanel}>
                <p>
                  L’application est éditée par l’Institut national de l’information géographique et forestière
                  (IGN), Établissement public administratif, 73 avenue de Paris, 94165 SAINT-MANDÉ CEDEX, France,
                  01 43 98 80 00.
                </p>
                <p>Directeur de la publication : Sébastien Soriano, directeur général de l’IGN.</p>
                <p className={styles.legalHeading}>Données accessibles par tous depuis l’application</p>
                <p>L’application vous permet d’accéder à :</p>
                <ul className={styles.legalList}>
                  <li>des données géographiques présentées sous forme de cartes </li>
                  <li>des données géodésiques IGN et CANEX.</li>
                </ul>
                <p>
                  Ces données émanent de différents producteurs, dont l’IGN, et sont propriété de leurs
                  producteurs respectifs.
                </p>
                <p>
                  L’accès et l’utilisation de ces données est gratuit et illimité pour tous les usages privés
                  comme professionnels, sous réserve du respect des droits de propriété intellectuelle et des
                  conditions de licence, notamment les licences IGN accessibles ici :{' '}
                  <TrackedExternalLink
                    href="https://geoservices.ign.fr/cgu-licences"
                    tracking={aboutTracking('Licences Géoservices')}
                  >
                    Conditions de licences | Géoservices (ign.fr)
                  </TrackedExternalLink>
                </p>
                <p>
                  Les données accessibles depuis l’application sont publiées à titre d’information, à
                  l’exclusion de toute garantie sur leur exactitude ou leur adéquation à vos besoins. En
                  particulier, les données accessibles depuis l’application n’engagent en aucun cas la
                  responsabilité de l’IGN en cas de dommage direct ou indirect découlant de leur non-conformité
                  à la réalité du terrain.
                </p>
                <p>
                  Les données géographiques peuvent concerner des informations confidentielles en matière de
                  défense nationale, de sécurité civile, de protection des données archéologiques ou des espèces
                  rares (liste non exhaustive). Ces données sont donc susceptibles d’être localement altérées de
                  manière à ne pas divulguer d’informations protégées par la loi.
                </p>
                <p>
                  Si vous constatiez une erreur ou une omission dans les données accessibles par tous depuis
                  l’application, nous vous remercions de nous la communiquer via la fonctionnalité Signaler.
                </p>
                
                <p className={styles.legalHeading}>Signalements que vous créez depuis l’application</p>
                <p>
                  L’application vous permet de signaler le statut de repères géodésiques sur le terrain. 
                  Ces signalements sont stockés localement sur votre téléphone portable ou tablette et accessibles depuis le menu « Enregistrés » et envoyés sur le serveur de l’IGN.
                  Ils sont également accessibles depuis l’<TrackedExternalLink
                    href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}
                    tracking={aboutTracking('Espace collaboratif')}
                  >Espace collaboratif IGN</TrackedExternalLink>.
                </p>
              </div>
            ) : null}
          </article>


          <article className={styles.legal}>
            <TrackedExternalLink
              href={EXTERNAL_LINKS.DONNEES_PERSONNELLES}
              tracking={aboutTracking('Données personnelles')}
              className={`${styles.legalTrigger} ${styles.legalRowLink}`}
              showIcon={false}
            >
              <span className={styles.legalLabel}>Données à caractère personnel</span>
              <span className={styles.legalExternalLink} aria-hidden>
                <IconExternalLink className={styles.legalExternalLinkIcon} />
              </span>
            </TrackedExternalLink>
          </article>


          <article className={styles.legal}>
            <TrackedExternalLink
              href={EXTERNAL_LINKS.ACCESSIBILITE}
              tracking={aboutTracking('Accessibilité')}
              className={`${styles.legalTrigger} ${styles.legalRowLink}`}
              showIcon={false}
            >
              <span className={styles.legalLabel}>Déclaration d'accessibilité</span>
              <span className={styles.legalExternalLink} aria-hidden>
                <IconExternalLink className={styles.legalExternalLinkIcon} />
              </span>
            </TrackedExternalLink>
          </article>


          <article className={styles.legal}>
            <TrackedExternalLink
              href={EXTERNAL_LINKS.CODE_SOURCE}
              tracking={aboutTracking('Code source')}
              className={`${styles.legalTrigger} ${styles.legalRowLink}`}
              showIcon={false}
            >
              <span className={styles.legalLabel}>Code source</span>
              <span className={styles.legalExternalLink} aria-hidden>
                <IconExternalLink className={styles.legalExternalLinkIcon} />
              </span>
            </TrackedExternalLink>
          </article>

          <article className={styles.legal}>
            <TrackedExternalLink
              href={EXTERNAL_LINKS.LICENCES_OPENSOURCE}
              tracking={aboutTracking('Licences OpenSource')}
              className={`${styles.legalTrigger} ${styles.legalRowLink}`}
              showIcon={false}
            >
              <span className={styles.legalLabel}>Licences open source</span>
              <span className={styles.legalExternalLink} aria-hidden>
                <IconExternalLink className={styles.legalExternalLinkIcon} />
              </span>
            </TrackedExternalLink>
          </article>

        </section>
      </main>
    </SlideUpPage>
  );
}
