import Link from 'next/link';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import { FiArrowRight, FiEdit3, FiMessageSquare, FiShield } from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

const reportChecklist = [
  'Roadmap-Instanz und Link zum betroffenen Projekt',
  'Was aktuell angezeigt wird und was stattdessen gelten soll',
  'Quelle oder zuständige Kontaktperson für die Änderung',
  'Falls relevant: gewünschter Zeitraum oder nächster Meilenstein',
];

const ProjekteMelden = () => {
  return (
    <HelpLayout
      title="Neue Projekte und Korrekturen melden"
      description={
        <>
          Nutzen Sie für inhaltliche Änderungen den Kontakt zum Roadmap-Team. Feature-Wünsche zur
          Anwendung gehören dagegen auf die Feedback-Seite. Diese Trennung sorgt dafür, dass Ihr
          Anliegen direkt bei der richtigen Stelle landet.
        </>
      }
      breadcrumbs={[{ label: 'Hilfe', href: '/help' }, { label: 'Projekte melden' }]}
      learningGoals={[
        'Den richtigen Kanal für Inhalt, Störung oder Feature-Wunsch wählen.',
        'Alle Angaben zusammenstellen, die Rückfragen vermeiden.',
        'Vertrauliche Daten aus der Meldung heraushalten.',
        'Nach der Aktualisierung das Ergebnis selbst prüfen.',
      ]}
      actions={
        <>
          <a className="ds-button ds-button-primary" href="mailto:roadmap@jsd.bs.ch">
            Roadmap-Team anschreiben
            <FiArrowRight className="ds-icon-sm" />
          </a>
          <Link className="ds-button ds-button-secondary" href="/feedback">
            Feature-Wunsch einreichen
          </Link>
        </>
      }
    >
      <section aria-labelledby="kanal-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Welcher Kanal passt?</p>
            <h2 id="kanal-heading" className="ds-section-title">
              Erst das Anliegen einordnen
            </h2>
          </div>
          <p className="ds-section-copy">
            Eine eindeutige Zuordnung senkt die Wartezeit und verhindert, dass Informationen
            zwischen Teams verloren gehen.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <article className="ds-card ds-help-card">
            <div className="ds-help-card-header">
              <div className="ds-help-card-icon" aria-hidden="true">
                <FiEdit3 className="ds-icon-sm" />
              </div>
              <span className="ds-help-card-badge">E-Mail</span>
            </div>
            <h3 className="ds-help-card-title">Roadmap-Inhalt</h3>
            <p className="ds-help-card-copy">
              Für neue Projekte, falsche Statusangaben, Termine, Verantwortliche, Texte, Links oder
              fehlende Projekte schreiben Sie an das Roadmap-Team.
            </p>
          </article>
          <article className="ds-card ds-help-card">
            <div className="ds-help-card-header">
              <div className="ds-help-card-icon" aria-hidden="true">
                <FiMessageSquare className="ds-icon-sm" />
              </div>
              <span className="ds-help-card-badge">Feedback-Seite</span>
            </div>
            <h3 className="ds-help-card-title">Funktion der Anwendung</h3>
            <p className="ds-help-card-copy">
              Für neue Filter, Ansichten oder andere Produktideen nutzen Sie die Feedback-Seite.
              Dort können angemeldete Personen Wünsche sehen und bewerten.
            </p>
          </article>
          <article className="ds-card ds-help-card">
            <div className="ds-help-card-header">
              <div className="ds-help-card-icon" aria-hidden="true">
                <FiShield className="ds-icon-sm" />
              </div>
              <span className="ds-help-card-badge">Support</span>
            </div>
            <h3 className="ds-help-card-title">Zugriff oder Störung</h3>
            <p className="ds-help-card-copy">
              Bei einer Fehlermeldung, einer Anmeldeschleife oder fehlendem Zugriff verwenden Sie
              die Support-Seite und nennen den genauen Wortlaut der Meldung.
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]" aria-labelledby="meldung-heading">
        <article className="ds-card p-6 sm:p-8">
          <p className="ds-panel-label">Vor dem Absenden</p>
          <h2 id="meldung-heading" className="ds-section-title">
            Diese Angaben ermöglichen eine eindeutige Prüfung
          </h2>
          <div className="ds-info-list mt-6">
            {reportChecklist.map((item) => (
              <p key={item} className="ds-info-item">
                {item}
              </p>
            ))}
          </div>
        </article>
        <aside className="ds-card p-6 sm:p-8" aria-label="Vorlage für eine Meldung">
          <p className="ds-panel-label">Kopiervorlage</p>
          <h3 className="ds-help-card-title">Kurze, vollständige Nachricht</h3>
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300">
            <p>Instanz: …</p>
            <p>Projekt/Link: …</p>
            <p>Aktueller Stand: …</p>
            <p>Gewünschte Änderung: …</p>
            <p>Quelle/Kontakt: …</p>
          </div>
        </aside>
      </section>

      <section aria-labelledby="ablauf-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Nach dem Absenden</p>
            <h2 id="ablauf-heading" className="ds-section-title">
              So bleibt der weitere Ablauf nachvollziehbar
            </h2>
          </div>
        </div>
        <div className="ds-steps">
          {[
            {
              title: 'Prüfung ermöglichen',
              copy: 'Das zuständige Team gleicht die Meldung mit der verantwortlichen Stelle ab. Bei fehlendem Kontext kann eine Rückfrage nötig sein.',
            },
            {
              title: 'Keine feste Frist voraussetzen',
              copy: 'Der Zeitpunkt der Aktualisierung hängt vom Umfang und von der fachlichen Freigabe ab. Dringlichkeit deshalb sachlich begründen.',
            },
            {
              title: 'Ergebnis kontrollieren',
              copy: 'Öffnen Sie nach der Rückmeldung die richtige Instanz neu und prüfen Sie Projekt-Detail, Zeitraum und Filterdarstellung.',
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

      <section className="ds-card ds-help-support-panel" aria-labelledby="datenschutz-heading">
        <div>
          <p className="ds-panel-label">Datenschutz</p>
          <h2 id="datenschutz-heading" className="ds-section-title">
            Nur notwendige Informationen senden
          </h2>
          <p className="ds-section-copy">
            Übermitteln Sie keine Passwörter, Zugangstokens oder besonders schützenswerte
            Personendaten. Verweisen Sie für vertrauliche Unterlagen auf den dafür vorgesehenen
            internen Ablageort, sofern die empfangende Person zugriffsberechtigt ist.
          </p>
        </div>
        <div className="ds-actions ds-help-support-actions">
          <Link className="ds-button ds-button-primary" href="/support">
            Support öffnen
          </Link>
          <Link className="ds-button ds-button-secondary" href="/help/faq">
            Häufige Fragen
          </Link>
        </div>
      </section>
    </HelpLayout>
  );
};

export default ProjekteMelden;
