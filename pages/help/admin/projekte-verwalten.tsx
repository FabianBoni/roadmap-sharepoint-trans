import Link from 'next/link';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import { FiArrowRight, FiCheckCircle, FiEdit3, FiTrash2 } from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

const projectSteps = [
  {
    title: 'Instanz und vorhandene Einträge prüfen',
    description:
      'Kontrollieren Sie die aktive Instanz und suchen Sie nach ähnlichen Projekten. So vermeiden Sie Dubletten und Änderungen am falschen Datenbestand.',
  },
  {
    title: '„Projekte“ und „Neues Projekt“ wählen',
    description:
      'Im Admin-Dashboard ist der Reiter „Projekte“ standardmäßig geöffnet. Bestehende Einträge lassen sich dort bearbeiten.',
  },
  {
    title: 'Projektart zuerst festlegen',
    description:
      'Kurzzeitprojekte benötigen weniger Pflichtangaben. Langzeitprojekte verlangen zusätzlich ausführlichere Angaben zur Verantwortung und Entwicklung.',
  },
  {
    title: 'Pflichtfelder und Datenlogik prüfen',
    description:
      'Titel, Beschreibung, Status, Startdatum, Enddatum und Kategorie sind erforderlich. Das Enddatum muss am oder nach dem Startdatum liegen.',
  },
  {
    title: 'Speichern und in der Roadmap kontrollieren',
    description:
      'Öffnen Sie anschließend dieselbe Instanz und prüfen Sie Titel, Kategorie, zeitliche Lage, Status und Projekt-Detail.',
  },
];

const ProjekteVerwalten = () => {
  return (
    <HelpLayout
      eyebrow="Admin-Handbuch"
      title="Projekte anlegen, aktualisieren und entfernen"
      description={
        <>
          Gute Projektdaten beantworten die wichtigsten Fragen ohne Rückfrage: Worum geht es, wann
          findet es statt, wer ist verantwortlich und wie ist der aktuelle Stand? Pflegen Sie nur
          bestätigte Informationen und kontrollieren Sie die sichtbare Darstellung nach dem
          Speichern.
        </>
      }
      breadcrumbs={[
        { label: 'Hilfe', href: '/help' },
        { label: 'Admin', href: '/help/admin' },
        { label: 'Projekte verwalten' },
      ]}
      learningGoals={[
        'Dubletten und Änderungen an der falschen Instanz vermeiden.',
        'Kurzzeit- und Langzeitprojekt korrekt unterscheiden.',
        'Pflichtfelder, optionale Details und Datumslogik verstehen.',
        'Abschließen, Spiegelung und Löschen sicher handhaben.',
      ]}
      actions={
        <>
          <Link className="ds-button ds-button-primary" href="/admin">
            Projekte im Adminbereich öffnen
            <FiArrowRight className="ds-icon-sm" />
          </Link>
          <Link className="ds-button ds-button-secondary" href="/help/admin">
            Zur Admin-Übersicht
          </Link>
        </>
      }
    >
      <section aria-labelledby="anlegen-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Neues Projekt</p>
            <h2 id="anlegen-heading" className="ds-section-title">
              In fünf kontrollierten Schritten anlegen
            </h2>
          </div>
        </div>
        <div className="ds-steps">
          {projectSteps.map((step, index) => (
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

      <section className="grid gap-5 md:grid-cols-2" aria-label="Projektarten">
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiCheckCircle className="ds-icon-sm" />
            </div>
            <span className="ds-help-card-badge">Weniger Pflichtfelder</span>
          </div>
          <h2 className="ds-help-card-title">Kurzzeitprojekt</h2>
          <p className="ds-help-card-copy">
            Geeignet für kompakte Vorhaben. Projektleitung, Budget, Phase, Rückblick und Ausblick
            können optional ergänzt werden. Verwenden Sie diese Art nicht nur, um fehlende Angaben
            bei einem langfristigen Projekt zu umgehen.
          </p>
        </article>
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiEdit3 className="ds-icon-sm" />
            </div>
            <span className="ds-help-card-badge">Erweiterte Pflichtfelder</span>
          </div>
          <h2 className="ds-help-card-title">Langzeitprojekt</h2>
          <p className="ds-help-card-copy">
            Erfordert zusätzlich Projektleitung, Budget, „Bisher“, „In Zukunft“ und geplante
            Umsetzung. Phase, Meilenstein, Team, Links, Badges und weitere Felder erhöhen die
            Aussagekraft, wenn sie aktuell gehalten werden.
          </p>
        </article>
      </section>

      <section aria-labelledby="aktualisieren-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Bestehendes Projekt</p>
            <h2 id="aktualisieren-heading" className="ds-section-title">
              Gezielt aktualisieren statt alles neu erfassen
            </h2>
          </div>
          <p className="ds-section-copy">
            Ändern Sie zuerst die Informationen, die Nutzende für Entscheidungen brauchen: Status,
            Zeitraum, Fortschritt, Phase, Meilenstein und Verantwortung.
          </p>
        </div>
        <div className="ds-help-list">
          <div className="ds-help-list-item">
            <div className="ds-help-list-icon" aria-hidden="true">
              <FiEdit3 className="ds-icon-sm" />
            </div>
            <div>
              <h3>Bearbeiten</h3>
              <p>
                Wählen Sie in der Projektliste „Bearbeiten“. Prüfen Sie vor dem Speichern, ob Datum,
                Status und Fortschritt zusammenpassen und Links weiterhin erreichbar sind.
              </p>
            </div>
          </div>
          <div className="ds-help-list-item">
            <div className="ds-help-list-icon" aria-hidden="true">
              <FiCheckCircle className="ds-icon-sm" />
            </div>
            <div>
              <h3>Abschließen</h3>
              <p>
                Setzen Sie regulär beendete Projekte auf „Abgeschlossen“ und den Fortschritt auf 100
                %. Dadurch bleibt der Projektverlauf sichtbar und auffindbar.
              </p>
            </div>
          </div>
          <div className="ds-help-list-item">
            <div className="ds-help-list-icon" aria-hidden="true">
              <FiTrash2 className="ds-icon-sm" />
            </div>
            <div>
              <h3>Löschen</h3>
              <p>
                Verwenden Sie „Löschen“ nur für Dubletten oder irrtümliche Einträge. Nach der
                Sicherheitsabfrage wird das Projekt entfernt; die Oberfläche bietet keine
                Wiederherstellung an.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-card ds-help-support-panel" aria-labelledby="spiegel-heading">
        <div>
          <p className="ds-panel-label">Read-only Spiegelung</p>
          <h2 id="spiegel-heading" className="ds-section-title">
            Gespiegelte Projekte in der Quellinstanz pflegen
          </h2>
          <p className="ds-section-copy">
            Bei einem gespiegelten Projekt zeigt die Adminliste „Nur lesen“. Suchen Sie die im
            Projekt-Detail genannte Quellinstanz und nehmen Sie die Änderung dort vor. Falls Ihnen
            dort die Berechtigung fehlt, wenden Sie sich an deren zuständige Administration.
          </p>
        </div>
        <div className="ds-actions ds-help-support-actions">
          <Link className="ds-button ds-button-primary" href="/roadmap">
            Ergebnis prüfen
          </Link>
          <Link className="ds-button ds-button-secondary" href="/help/projekte-melden">
            Korrektur melden
          </Link>
        </div>
      </section>
    </HelpLayout>
  );
};

export default ProjekteVerwalten;
