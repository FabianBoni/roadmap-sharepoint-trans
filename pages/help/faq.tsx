import Link from 'next/link';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import { FiArrowRight, FiHelpCircle } from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

type Question = {
  question: string;
  answer: string;
  link?: { label: string; href: string };
};

const groups: Array<{ id: string; title: string; questions: Question[] }> = [
  {
    id: 'orientierung-inhalte',
    title: 'Orientierung und Inhalte',
    questions: [
      {
        question: 'Was zeigt die Roadmap?',
        answer:
          'Eine Roadmap-Instanz bündelt die für ihren Bereich gepflegten Projekte. Je nach Datenlage sehen Sie unter anderem Zeitraum, Status, Fortschritt, Phase, Verantwortliche, Meilensteine, Links und Anhänge.',
      },
      {
        question: 'Warum sehe ich andere Projekte als eine Kollegin oder ein Kollege?',
        answer:
          'Prüfen Sie zuerst die ausgewählte Instanz, das Jahr und aktive Filter. Zusätzlich kann die Sichtbarkeit einer Instanz von Ihrer Abteilung oder einer expliziten Freigabe abhängen.',
        link: { label: 'Projekte finden und filtern', href: '/help/projekte-ansehen' },
      },
      {
        question: 'Was bedeutet „Read-only Spiegelung“?',
        answer:
          'Das Projekt stammt aus einer anderen Roadmap-Instanz und wird in der aktuellen Instanz nur angezeigt. Bearbeitet wird es in seiner Quellinstanz; deshalb stehen hier keine Bearbeitungsaktionen zur Verfügung.',
      },
      {
        question: 'Warum fehlen in einem Projekt einzelne Angaben?',
        answer:
          'Nicht jedes Feld ist für jedes Projekt befüllt. Insbesondere Kurzzeitprojekte können bewusst weniger Detailangaben enthalten. Ein leerer Bereich ist daher nicht automatisch ein technischer Fehler.',
      },
    ],
  },
  {
    id: 'suche-darstellung',
    title: 'Suche und Darstellung',
    questions: [
      {
        question: 'Wie finde ich ein bestimmtes Projekt?',
        answer:
          'Beginnen Sie mit einem eindeutigen Stichwort. Die Suche berücksichtigt neben Titel und Beschreibung auch Projektleitung, Meilenstein, Tags und Teammitglieder. Grenzen Sie die Treffer anschließend mit wenigen Filtern ein.',
        link: { label: 'Anleitung zur Roadmap', href: '/help/projekte-ansehen' },
      },
      {
        question: 'Warum zeigt die Suche keine Treffer?',
        answer:
          'Wählen Sie zunächst „Alle Filter zurücksetzen“, kontrollieren Sie Instanz und Jahr und versuchen Sie einen kürzeren Suchbegriff. Prüfen Sie auch, ob „Nur laufende Projekte“ oder ein enger Monatsbereich aktiv ist.',
      },
      {
        question: 'Welche Ansicht sollte ich verwenden?',
        answer:
          'Der Zeitstrahl beantwortet vor allem die Frage „Wann findet etwas statt?“. Die Kacheln erleichtern den kompakten Vergleich von Projekten. Für den vollständigen Kontext öffnen Sie das Projekt-Detail.',
      },
      {
        question: 'Kann ich eine gefilterte Ansicht teilen?',
        answer:
          'Ja. Suche, Filter, Kategorien und die Kachelansicht werden in der URL abgebildet. Kopieren Sie die vollständige Browseradresse, nachdem die gewünschte Ansicht sichtbar ist.',
      },
    ],
  },
  {
    id: 'zugang-support',
    title: 'Zugang, Änderungen und Support',
    questions: [
      {
        question: 'Warum erhalte ich „Kein Zugriff“?',
        answer:
          'Die Sichtbarkeit wird pro Instanz gesteuert. Vergewissern Sie sich, dass Sie die richtige Instanz geöffnet und sich mit dem vorgesehenen Microsoft-Konto angemeldet haben. Bleibt die Meldung bestehen, senden Sie dem Support den Instanznamen und den Wortlaut der Meldung.',
        link: { label: 'Rechte und Zugang', href: '/help/admin/rechte-und-zugang' },
      },
      {
        question: 'Wie erhalte ich Admin-Rechte?',
        answer:
          'Admin-Rechte entstehen über die Admin-Liste der Instanz, eine konfigurierte Admin-Gruppe oder eine Superadmin-Rolle. Eine bestehende Administratorin oder ein bestehender Administrator kann Sie für die betreffende Instanz hinzufügen.',
        link: { label: 'Admin-Zugang verstehen', href: '/help/admin/rechte-und-zugang' },
      },
      {
        question: 'Wie melde ich eine falsche Projektangabe?',
        answer:
          'Schreiben Sie dem Roadmap-Team und nennen Sie Instanz, Projektlink, aktuellen Stand, gewünschte Änderung und die fachlich zuständige Kontaktperson. Für Feature-Wünsche der Anwendung nutzen Sie stattdessen die Feedback-Seite.',
        link: { label: 'Inhalte richtig melden', href: '/help/projekte-melden' },
      },
      {
        question: 'Was hilft bei einer Anmeldeschleife oder abgelaufenen Sitzung?',
        answer:
          'Öffnen Sie die Anmeldung erneut und wählen Sie „Status erneut prüfen“. Falls ein Popup blockiert wird, erlauben Sie Popups für diese Website. Bleibt das Problem bestehen, nennen Sie dem Support Browser, Instanz und genaue Fehlermeldung.',
      },
    ],
  },
];

const FAQ = () => {
  return (
    <HelpLayout
      title="Häufige Fragen und schnelle Lösungen"
      description={
        <>
          Suchen Sie zuerst nach dem Bereich, der zu Ihrer Situation passt. Jede Antwort nennt den
          nächsten sinnvollen Schritt, ohne technisches Vorwissen vorauszusetzen.
        </>
      }
      breadcrumbs={[{ label: 'Hilfe', href: '/help' }, { label: 'FAQ' }]}
      learningGoals={[
        'Abweichende oder fehlende Projekte systematisch erklären.',
        'Probleme mit Suche und Filtern selbst beheben.',
        'Zugriffs- und Anmeldeprobleme richtig einordnen.',
        'Inhaltskorrektur, Feature-Wunsch und Support unterscheiden.',
      ]}
      actions={
        <>
          <Link className="ds-button ds-button-primary" href="/help/erste-schritte">
            Mit den Grundlagen starten
            <FiArrowRight className="ds-icon-sm" />
          </Link>
          <Link className="ds-button ds-button-secondary" href="/support">
            Support kontaktieren
          </Link>
        </>
      }
    >
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`faq-${group.id}`}>
          <div className="ds-section-header">
            <div>
              <p className="ds-panel-label">FAQ</p>
              <h2 id={`faq-${group.id}`} className="ds-section-title">
                {group.title}
              </h2>
            </div>
          </div>
          <div className="space-y-4">
            {group.questions.map((entry) => (
              <details key={entry.question} className="ds-card group p-6 open:border-sky-500/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white sm:text-lg">
                  <span>{entry.question}</span>
                  <FiHelpCircle
                    className="ds-icon-sm shrink-0 text-sky-300 transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">{entry.answer}</p>
                {entry.link && (
                  <Link className="ds-help-link" href={entry.link.href}>
                    {entry.link.label}
                    <FiArrowRight className="ds-icon-sm" />
                  </Link>
                )}
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="ds-card ds-help-support-panel" aria-labelledby="support-heading">
        <div>
          <p className="ds-panel-label">Noch offen?</p>
          <h2 id="support-heading" className="ds-section-title">
            Eine gute Supportanfrage spart Rückfragen
          </h2>
          <p className="ds-section-copy">
            Nennen Sie Instanz, Seite oder Projektlink, den gewünschten Ablauf, den tatsächlich
            beobachteten Ablauf und die genaue Fehlermeldung. Senden Sie keine Passwörter oder
            Zugangstokens.
          </p>
        </div>
        <div className="ds-actions ds-help-support-actions">
          <Link className="ds-button ds-button-primary" href="/support">
            Support-Seite öffnen
          </Link>
          <Link className="ds-button ds-button-secondary" href="/docs">
            Technische Dokumentation
          </Link>
        </div>
      </section>
    </HelpLayout>
  );
};

export default FAQ;
