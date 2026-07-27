import Link from 'next/link';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiEdit3,
  FiHelpCircle,
  FiMail,
  FiMessageSquare,
} from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

const supportChecklist = [
  'Betroffene Roadmap-Instanz und Link zur Seite oder zum Projekt',
  'Was Sie tun wollten und welches Ergebnis Sie erwartet haben',
  'Was stattdessen passiert ist – inklusive genauer Fehlermeldung',
  'Datum und ungefähre Uhrzeit des Problems',
  'Browser und Gerät sowie bereits ausprobierte Lösungsschritte',
];

const SupportPage = () => {
  return (
    <HelpLayout
      eyebrow="Persönlicher Support"
      title="Schnell zur richtigen Unterstützung"
      description={
        <>
          Viele Fragen lassen sich direkt in der Hilfe klären. Wenn Sie persönliche Unterstützung
          benötigen, wählen Sie zuerst die Art Ihres Anliegens und senden anschließend die Angaben,
          die eine gezielte Prüfung ermöglichen.
        </>
      }
      breadcrumbs={[{ label: 'Hilfe', href: '/help' }, { label: 'Support' }]}
      learningGoals={[
        'Einfache Ursachen vor der Kontaktaufnahme ausschließen.',
        'Den passenden Kanal für Störung, Inhalt oder Feature-Wunsch wählen.',
        'Eine vollständige und nachvollziehbare Supportanfrage verfassen.',
        'Passwörter und andere sensible Informationen sicher behandeln.',
      ]}
      actions={
        <>
          <a className="ds-button ds-button-primary" href="mailto:roadmap@jsd.bs.ch">
            <FiMail className="ds-icon-sm" />
            Roadmap-Team anschreiben
          </a>
          <Link className="ds-button ds-button-secondary" href="/help/faq">
            Häufige Fragen prüfen
          </Link>
        </>
      }
    >
      <section aria-labelledby="selbsthilfe-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Vor der Kontaktaufnahme</p>
            <h2 id="selbsthilfe-heading" className="ds-section-title">
              Drei kurze Prüfungen lösen viele Probleme
            </h2>
          </div>
          <p className="ds-section-copy">
            Führen Sie nur die Schritte aus, die zu Ihrer Situation passen. Notieren Sie das
            Ergebnis für den Support, falls das Problem bestehen bleibt.
          </p>
        </div>

        <div className="ds-steps">
          {[
            {
              title: 'Seite neu laden und Anmeldung prüfen',
              copy: 'Laden Sie die Seite einmal neu. Bei einer Anmeldeschleife öffnen Sie die Anmeldung erneut und wählen „Status erneut prüfen“.',
            },
            {
              title: 'Instanz, Jahr und Filter kontrollieren',
              copy: 'Fehlende Projekte entstehen häufig durch eine andere Roadmap-Instanz, einen engen Zeitraum oder aktive Filter. Setzen Sie die Filter testweise zurück.',
            },
            {
              title: 'Passende Anleitung öffnen',
              copy: 'Die häufigen Fragen erklären Zugriffs-, Such- und Darstellungsprobleme. Für die Bedienung führt der Bereich „Erste Schritte“ durch den normalen Ablauf.',
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

        <div className="ds-actions">
          <Link className="ds-button ds-button-secondary" href="/help/faq">
            FAQ öffnen
            <FiArrowRight className="ds-icon-sm" />
          </Link>
          <Link className="ds-button ds-button-secondary" href="/help/erste-schritte">
            Erste Schritte öffnen
          </Link>
        </div>
      </section>

      <section aria-labelledby="kanal-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Welcher Weg passt?</p>
            <h2 id="kanal-heading" className="ds-section-title">
              Anliegen richtig einordnen
            </h2>
          </div>
          <p className="ds-section-copy">
            Die Auswahl verhindert unnötige Weiterleitungen und macht den nächsten Schritt
            eindeutig.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="ds-card ds-help-card">
            <div className="ds-help-card-header">
              <div className="ds-help-card-icon" aria-hidden="true">
                <FiAlertCircle className="ds-icon-sm" />
              </div>
              <span className="ds-help-card-badge">Live-Chat</span>
            </div>
            <h3 className="ds-help-card-title">Störung oder fehlender Zugriff</h3>
            <p className="ds-help-card-copy">
              Bei Fehlermeldungen, Anmeldeproblemen oder unerwartet fehlenden Berechtigungen öffnen
              Sie das schwebende Chat-Symbol unten rechts.
            </p>
            <a className="ds-help-link" href="mailto:roadmap@jsd.bs.ch">
              Alternativ E-Mail senden
              <FiArrowRight className="ds-icon-sm" />
            </a>
          </article>

          <article className="ds-card ds-help-card">
            <div className="ds-help-card-header">
              <div className="ds-help-card-icon" aria-hidden="true">
                <FiEdit3 className="ds-icon-sm" />
              </div>
              <span className="ds-help-card-badge">Inhalt</span>
            </div>
            <h3 className="ds-help-card-title">Projekt ergänzen oder korrigieren</h3>
            <p className="ds-help-card-copy">
              Für fehlende Projekte, falsche Termine, Statusangaben oder Verantwortlichkeiten hilft
              die Anleitung für Inhaltsmeldungen.
            </p>
            <Link className="ds-help-link" href="/help/projekte-melden">
              Inhaltsänderung vorbereiten
              <FiArrowRight className="ds-icon-sm" />
            </Link>
          </article>

          <article className="ds-card ds-help-card">
            <div className="ds-help-card-header">
              <div className="ds-help-card-icon" aria-hidden="true">
                <FiMessageSquare className="ds-icon-sm" />
              </div>
              <span className="ds-help-card-badge">Feedback</span>
            </div>
            <h3 className="ds-help-card-title">Neue Funktion vorschlagen</h3>
            <p className="ds-help-card-copy">
              Wünsche für neue Filter, Ansichten oder Funktionen gehören auf die Feedback-Seite.
              Dort können angemeldete Personen Vorschläge bewerten.
            </p>
            <Link className="ds-help-link" href="/feedback">
              Feature-Wunsch einreichen
              <FiArrowRight className="ds-icon-sm" />
            </Link>
          </article>
        </div>
      </section>

      <section
        className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]"
        aria-labelledby="anfrage-heading"
      >
        <article className="ds-card p-6 sm:p-8">
          <p className="ds-panel-label">Vollständige Anfrage</p>
          <h2 id="anfrage-heading" className="ds-section-title">
            Diese Angaben vermeiden Rückfragen
          </h2>
          <div className="ds-info-list mt-6">
            {supportChecklist.map((item) => (
              <p key={item} className="ds-info-item">
                {item}
              </p>
            ))}
          </div>
        </article>

        <aside className="ds-card p-6 sm:p-8" aria-label="Vorlage für eine Supportanfrage">
          <p className="ds-panel-label">Kopiervorlage</p>
          <h3 className="ds-help-card-title">Kurz und nachvollziehbar schreiben</h3>
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300">
            <p>Instanz: …</p>
            <p>Seite oder Projektlink: …</p>
            <p>Zeitpunkt: …</p>
            <p>Mein Ziel: …</p>
            <p>Beobachtetes Verhalten: …</p>
            <p>Fehlermeldung: …</p>
            <p>Bereits geprüft: …</p>
          </div>
          <a className="ds-help-link" href="mailto:roadmap@jsd.bs.ch">
            <FiMail className="ds-icon-sm" />
            roadmap@jsd.bs.ch
          </a>
        </aside>
      </section>

      <section className="ds-card ds-help-support-panel" aria-labelledby="sicherheit-heading">
        <div>
          <p className="ds-panel-label">Sicher kommunizieren</p>
          <h2 id="sicherheit-heading" className="ds-section-title">
            Keine Zugangsdaten mitsenden
          </h2>
          <p className="ds-section-copy">
            Senden Sie niemals Passwörter, Sitzungscookies, Zugangstokens oder geheime
            Konfigurationswerte. Prüfen Sie Screenshots auf personenbezogene oder vertrauliche
            Angaben und entfernen Sie alles, was für die Fehleranalyse nicht notwendig ist.
          </p>
        </div>
        <div className="ds-actions ds-help-support-actions">
          <a className="ds-button ds-button-primary" href="mailto:roadmap@jsd.bs.ch">
            <FiMail className="ds-icon-sm" />
            E-Mail schreiben
          </a>
          <Link className="ds-button ds-button-secondary" href="/docs/erste-schritte/uebersicht">
            <FiHelpCircle className="ds-icon-sm" />
            Technische Dokumentation
          </Link>
        </div>
      </section>

      <section aria-labelledby="danach-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Nach dem Absenden</p>
            <h2 id="danach-heading" className="ds-section-title">
              So geht es weiter
            </h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: FiMail,
              title: 'Anfrage wird eingeordnet',
              copy: 'Das Roadmap-Team prüft, ob Bedienung, Inhalt, Berechtigung oder Technik betroffen ist.',
            },
            {
              icon: FiHelpCircle,
              title: 'Rückfragen beantworten',
              copy: 'Falls Informationen fehlen, antworten Sie möglichst im gleichen E-Mail-Verlauf, damit der Kontext erhalten bleibt.',
            },
            {
              icon: FiCheckCircle,
              title: 'Lösung überprüfen',
              copy: 'Öffnen Sie nach der Rückmeldung die betroffene Seite erneut und prüfen Sie den ursprünglichen Ablauf.',
            },
          ].map(({ icon: Icon, title, copy }) => (
            <article key={title} className="ds-card ds-help-card">
              <div className="ds-help-card-icon" aria-hidden="true">
                <Icon className="ds-icon-sm" />
              </div>
              <h3 className="ds-help-card-title">{title}</h3>
              <p className="ds-help-card-copy">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </HelpLayout>
  );
};

export default SupportPage;
