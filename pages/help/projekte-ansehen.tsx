import Link from 'next/link';
import { FiArrowRight, FiEye, FiFilter, FiSearch } from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

const findSteps = [
  {
    title: 'Passende Instanz öffnen',
    description:
      'Wählen Sie zuerst die Roadmap-Instanz Ihres Bereichs. So beziehen sich Suche und Filter auf den richtigen Datenbestand.',
  },
  {
    title: 'Suche oder Filter einsetzen',
    description:
      'Suchen Sie nach einem Begriff oder grenzen Sie die Treffer nach Kategorien, Status, Projektart, Zeitraum und weiteren Merkmalen ein.',
  },
  {
    title: 'Ansicht passend zur Frage wählen',
    description:
      'Nutzen Sie den Zeitstrahl für die zeitliche Einordnung und Kacheln für einen kompakten Projektvergleich.',
  },
  {
    title: 'Projekt öffnen',
    description:
      'Klicken oder tippen Sie auf ein Projekt, um Beschreibung, Verantwortliche, Phase, Meilenstein, Links und Anhänge zu sehen.',
  },
];

const ProjekteAnsehen = () => {
  return (
    <HelpLayout
      title="Projekte gezielt finden und verstehen"
      description={
        <>
          Starten Sie mit Ihrer konkreten Frage: Suchen Sie ein bekanntes Projekt, laufende Vorhaben
          oder einen Überblick über ein Jahr? Die folgenden Schritte führen ohne Umwege zur
          passenden Ansicht.
        </>
      }
      breadcrumbs={[{ label: 'Hilfe', href: '/help' }, { label: 'Projekte ansehen' }]}
      learningGoals={[
        'Die richtige Instanz und das gewünschte Jahr auswählen.',
        'Suche und Filter gezielt kombinieren und wieder zurücksetzen.',
        'Zeitstrahl, Kacheln und Projekt-Details passend einsetzen.',
        'Eine gefilterte Ansicht per URL weitergeben.',
      ]}
      actions={
        <>
          <Link className="ds-button ds-button-primary" href="/roadmap">
            Roadmap öffnen
            <FiArrowRight className="ds-icon-sm" />
          </Link>
          <Link className="ds-button ds-button-secondary" href="/help/erste-schritte">
            Grundlagen ansehen
          </Link>
        </>
      }
    >
      <section aria-labelledby="finden-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Schritt für Schritt</p>
            <h2 id="finden-heading" className="ds-section-title">
              Vom Anliegen zum passenden Projekt
            </h2>
          </div>
          <p className="ds-section-copy">
            Arbeiten Sie von grob nach fein. Das reduziert unnötige Filterkombinationen und macht
            fehlende Treffer leichter nachvollziehbar.
          </p>
        </div>
        <div className="ds-steps">
          {findSteps.map((step, index) => (
            <article key={step.title} className="ds-step">
              <span className="ds-step-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="ds-step-title">{step.title}</h3>
                <p className="ds-step-copy">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2" aria-label="Suche und Filter">
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiSearch className="ds-icon-sm" />
            </div>
            <span className="ds-help-card-badge">Bekanntes Projekt</span>
          </div>
          <h2 className="ds-help-card-title">Mit einem Begriff suchen</h2>
          <p className="ds-help-card-copy">
            Die Suche prüft Titel, Beschreibung, Projektleitung, nächsten Meilenstein, Tags und
            Teammitglieder. Beginnen Sie mit einem markanten Wort; ergänzen Sie erst danach Filter.
          </p>
          <div className="ds-note">
            <span className="ds-note-icon" aria-hidden="true">
              i
            </span>
            <p className="ds-step-copy">
              Weniger ist oft mehr: „Portal“ liefert eher einen Treffer als ein vollständiger
              Projekttitel mit abweichender Schreibweise.
            </p>
          </div>
        </article>

        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiFilter className="ds-icon-sm" />
            </div>
            <span className="ds-help-card-badge">Überblick</span>
          </div>
          <h2 className="ds-help-card-title">Mit Filtern eingrenzen</h2>
          <p className="ds-help-card-copy">
            Öffnen Sie „Erweiterte Filter“. Verfügbar sind unter anderem Projektart, Fortschritt,
            Status, Phase, Leitung, Tags, Badges, Monate und „Nur laufende Projekte“. Aktive Filter
            erscheinen als Chips und lassen sich einzeln entfernen.
          </p>
          <div className="ds-note">
            <span className="ds-note-icon" aria-hidden="true">
              ↺
            </span>
            <p className="ds-step-copy">
              Bei unerwartet wenigen Treffern zuerst „Alle Filter zurücksetzen“ wählen und dann
              jeweils nur einen Filter ergänzen.
            </p>
          </div>
        </article>
      </section>

      <section aria-labelledby="ansichten-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Ansichten richtig lesen</p>
            <h2 id="ansichten-heading" className="ds-section-title">
              Dieselben Projekte, ein anderer Fokus
            </h2>
          </div>
        </div>
        <div className="ds-help-list">
          <div className="ds-help-list-item">
            <div className="ds-help-list-icon" aria-hidden="true">
              <FiEye className="ds-icon-sm" />
            </div>
            <div>
              <h3>Zeitstrahl</h3>
              <p>
                Zeigt Projekte nach Kategorie und zeitlicher Lage. Wechseln Sie je nach benötigter
                Genauigkeit zwischen Quartalen, Monaten, Wochen und Jahren.
              </p>
            </div>
          </div>
          <div className="ds-help-list-item">
            <div className="ds-help-list-icon" aria-hidden="true">
              <FiEye className="ds-icon-sm" />
            </div>
            <div>
              <h3>Kachelansicht</h3>
              <p>
                Zeigt kompakte Angaben wie Zeitraum, Badges, Fortschritt sowie die Anzahl von Links
                und Teammitgliedern. Sie eignet sich zum schnellen Vergleich.
              </p>
            </div>
          </div>
          <div className="ds-help-list-item">
            <div className="ds-help-list-icon" aria-hidden="true">
              <FiEye className="ds-icon-sm" />
            </div>
            <div>
              <h3>Projekt-Detail</h3>
              <p>
                Enthält den vollständigen Kontext. Leere Bereiche bedeuten, dass für dieses Projekt
                noch keine entsprechende Angabe hinterlegt wurde.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-card ds-help-support-panel" aria-labelledby="teilen-heading">
        <div>
          <p className="ds-panel-label">Teilen & Fehler lösen</p>
          <h2 id="teilen-heading" className="ds-section-title">
            Ansicht weitergeben oder fehlende Daten melden
          </h2>
          <p className="ds-section-copy">
            Suche, Filter, Kategorien und Kachelansicht werden in der URL gespeichert. Kopieren Sie
            deshalb nach dem Filtern die vollständige Browseradresse. Fehlt ein Projekt trotz
            zurückgesetzter Filter, melden Sie die Instanz und den erwarteten Projektnamen.
          </p>
        </div>
        <div className="ds-actions ds-help-support-actions">
          <Link className="ds-button ds-button-primary" href="/help/projekte-melden">
            Inhalt melden
          </Link>
          <Link className="ds-button ds-button-secondary" href="/docs/funktionen/roadmap">
            Technische Details
          </Link>
        </div>
      </section>
    </HelpLayout>
  );
};

export default ProjekteAnsehen;
