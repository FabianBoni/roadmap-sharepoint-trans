import Link from 'next/link';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import { FiArrowRight, FiFolder, FiSettings, FiShield, FiSliders } from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

const adminTopics = [
  {
    title: 'Projekte verwalten',
    description:
      'Projekte anlegen, Pflichtfelder verstehen, bestehende Inhalte aktualisieren und Änderungen kontrollieren.',
    href: '/help/admin/projekte-verwalten',
    icon: FiSliders,
  },
  {
    title: 'Kategorien verwalten',
    description:
      'Namen, Farben und Icons so pflegen, dass Nutzerinnen und Nutzer Bereiche schnell unterscheiden.',
    href: '/help/admin/kategorien-verwalten',
    icon: FiFolder,
  },
  {
    title: 'Einstellungen & Design',
    description:
      'Vorhandene Instanz-Einstellungen sicher bearbeiten und sichtbare Änderungen in der Roadmap prüfen.',
    href: '/help/admin/einstellungen-und-design',
    icon: FiSettings,
  },
  {
    title: 'Rechte & Zugang',
    description:
      'Microsoft SSO, Leserechte und instanzbezogene Admin-Rechte unterscheiden und gezielt vergeben.',
    href: '/help/admin/rechte-und-zugang',
    icon: FiShield,
  },
];

const AdminHelp = () => {
  return (
    <HelpLayout
      eyebrow="Admin-Handbuch"
      title="Eine Roadmap-Instanz sicher pflegen"
      description={
        <>
          Der Adminbereich wirkt unmittelbar auf die ausgewählte Roadmap. Prüfen Sie deshalb vor
          jeder Änderung die aktive Instanz, bearbeiten Sie jeweils eine Sache und kontrollieren Sie
          das Ergebnis anschließend in der öffentlichen Ansicht.
        </>
      }
      breadcrumbs={[{ label: 'Hilfe', href: '/help' }, { label: 'Admin' }]}
      learningGoals={[
        'Vor jeder Änderung die aktive Instanz kontrollieren.',
        'Die passende Anleitung für Projekt, Kategorie, Einstellung oder Recht wählen.',
        'Änderungen nach dem Speichern in der Roadmap verifizieren.',
        'Löschen nur für nachweislich falsche Einträge verwenden.',
      ]}
      actions={
        <>
          <Link className="ds-button ds-button-primary" href="/admin">
            Admin-Dashboard öffnen
            <FiArrowRight className="ds-icon-sm" />
          </Link>
          <Link className="ds-button ds-button-secondary" href="/roadmap">
            Roadmap zur Kontrolle öffnen
          </Link>
        </>
      }
    >
      <section aria-labelledby="sicherer-ablauf-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Sicherer Standardablauf</p>
            <h2 id="sicherer-ablauf-heading" className="ds-section-title">
              Drei Kontrollen für jede Änderung
            </h2>
          </div>
          <p className="ds-section-copy">
            Ein gleichbleibender Ablauf reduziert versehentliche Änderungen an der falschen Instanz
            und macht Fehler leichter rückgängig.
          </p>
        </div>
        <div className="ds-steps">
          {[
            {
              title: 'Vorher: Kontext prüfen',
              copy: 'Kontrollieren Sie Instanz, Datensatz und fachliche Quelle. Bei Projekten mit „Read-only Spiegelung“ wechseln Sie zur Quellinstanz.',
            },
            {
              title: 'Währenddessen: gezielt ändern',
              copy: 'Ändern Sie nur die bestätigten Angaben. Prüfen Sie Pflichtfelder, Datum, Status und Schreibweise vor dem Speichern.',
            },
            {
              title: 'Nachher: Ergebnis ansehen',
              copy: 'Öffnen oder aktualisieren Sie die Roadmap, wählen Sie dieselbe Instanz und kontrollieren Sie Darstellung, Filter und Projekt-Detail.',
            },
          ].map((step, index) => (
            <article key={step.title} className="ds-step">
              <span className="ds-step-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="ds-step-title">{step.title}</h3>
                <p className="ds-step-copy">{step.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="themen-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Aufgabe auswählen</p>
            <h2 id="themen-heading" className="ds-section-title">
              Direkt zur passenden Anleitung
            </h2>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {adminTopics.map((topic) => (
            <Link key={topic.href} href={topic.href} className="ds-card ds-help-card">
              <div className="ds-help-card-header">
                <div className="ds-help-card-icon" aria-hidden="true">
                  <topic.icon className="ds-icon-sm" />
                </div>
              </div>
              <h3 className="ds-help-card-title">{topic.title}</h3>
              <p className="ds-help-card-copy">{topic.description}</p>
              <span className="ds-help-link">
                Anleitung öffnen
                <FiArrowRight className="ds-icon-sm" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2" aria-label="Sicherheitsregeln">
        <article className="ds-card p-6 sm:p-8">
          <p className="ds-panel-label">Vor dem Löschen</p>
          <h2 className="ds-help-card-title">Erst Alternativen prüfen</h2>
          <div className="ds-info-list mt-5">
            <p className="ds-info-item">
              Projektstatus aktualisieren, wenn das Vorhaben beendet ist.
            </p>
            <p className="ds-info-item">
              Zuordnung korrigieren, bevor eine Kategorie entfernt wird.
            </p>
            <p className="ds-info-item">
              Löschen nur bei Dubletten oder irrtümlich angelegten Daten.
            </p>
          </div>
        </article>
        <article className="ds-card p-6 sm:p-8">
          <p className="ds-panel-label">Bei Unsicherheit</p>
          <h2 className="ds-help-card-title">Änderung kurz unterbrechen</h2>
          <p className="ds-help-card-copy">
            Wenn Quelle, Zuständigkeit oder richtige Instanz unklar sind, speichern oder löschen Sie
            noch nicht. Klären Sie die fachliche Freigabe mit der verantwortlichen Person oder dem
            Roadmap-Team.
          </p>
          <Link className="ds-help-link" href="/support">
            Support kontaktieren
            <FiArrowRight className="ds-icon-sm" />
          </Link>
        </article>
      </section>
    </HelpLayout>
  );
};

export default AdminHelp;
