import Link from 'next/link';
import { FiArrowRight, FiEye, FiFolder, FiTrash2 } from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

const KategorienVerwalten = () => {
  return (
    <HelpLayout
      eyebrow="Admin-Handbuch"
      title="Kategorien verständlich strukturieren"
      description={
        <>
          Kategorien sind die wichtigsten Orientierungspunkte in Seitenleiste, Filtern und
          Zeitstrahl. Gute Bezeichnungen sind eindeutig, Farben unterscheidbar und Icons nur eine
          zusätzliche Hilfe – nie die einzige Bedeutungsträgerin.
        </>
      }
      breadcrumbs={[
        { label: 'Hilfe', href: '/help' },
        { label: 'Admin', href: '/help/admin' },
        { label: 'Kategorien verwalten' },
      ]}
      learningGoals={[
        'Vor dem Anlegen eine eindeutige, dauerhafte Bezeichnung wählen.',
        'Name, Farbe und Icon im vorhandenen Formular korrekt pflegen.',
        'Änderungen aus Sicht der Roadmap-Nutzenden kontrollieren.',
        'Kategorie erst löschen, wenn keine benötigte Zuordnung verloren geht.',
      ]}
      actions={
        <>
          <Link className="ds-button ds-button-primary" href="/admin">
            Kategorien im Adminbereich öffnen
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
            <p className="ds-panel-label">Neue Kategorie</p>
            <h2 id="anlegen-heading" className="ds-section-title">
              Vom Begriff zur sichtbaren Struktur
            </h2>
          </div>
        </div>
        <div className="ds-steps">
          {[
            {
              title: 'Bestehende Struktur prüfen',
              copy: 'Suchen Sie zuerst nach einer Kategorie mit gleicher oder ähnlicher Bedeutung. Zu viele Kategorien erhöhen die Such- und Entscheidungslast.',
            },
            {
              title: '„Kategorien“ und „Neue Kategorie“ öffnen',
              copy: 'Das Formular enthält Kategoriename, Farbe und Icon. Wählen Sie alle drei Angaben aus, damit die Kategorie erfolgreich gespeichert werden kann.',
            },
            {
              title: 'Eindeutigen Namen wählen',
              copy: 'Verwenden Sie bekannte Begriffe aus der Organisation und vermeiden Sie interne Abkürzungen, die nur ein kleiner Personenkreis versteht.',
            },
            {
              title: 'Speichern und Wirkung prüfen',
              copy: 'Kontrollieren Sie die Kategorie in der Seitenleiste, im Filter und im Zeitstrahl. Prüfen Sie auch, ob Farbe und Icon neben anderen Kategorien unterscheidbar sind.',
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

      <section className="grid gap-5 md:grid-cols-3" aria-label="Gestaltungsregeln">
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiFolder className="ds-icon-sm" />
            </div>
          </div>
          <h2 className="ds-help-card-title">Name</h2>
          <p className="ds-help-card-copy">
            Kurz, konkret und trennscharf. Zwei Kategorien sollten nicht fast gleich heißen. Der
            Name muss auch ohne Farbe oder Icon verständlich bleiben.
          </p>
        </article>
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiEye className="ds-icon-sm" />
            </div>
          </div>
          <h2 className="ds-help-card-title">Farbe</h2>
          <p className="ds-help-card-copy">
            Wählen Sie deutlich unterscheidbare Farben. Verlassen Sie sich nicht auf Rot-Grün als
            einzigen Unterschied und prüfen Sie die Wirkung auf dem dunklen Hintergrund.
          </p>
        </article>
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiFolder className="ds-icon-sm" />
            </div>
          </div>
          <h2 className="ds-help-card-title">Icon</h2>
          <p className="ds-help-card-copy">
            Nutzen Sie ein bekanntes, einfaches Symbol. Ähnliche Kategorien sollten nicht dasselbe
            Icon tragen; die Bedeutung muss trotzdem über den Text erkennbar sein.
          </p>
        </article>
      </section>

      <section aria-labelledby="aendern-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Bestehende Kategorie</p>
            <h2 id="aendern-heading" className="ds-section-title">
              Umbenennen, neu zuordnen oder löschen
            </h2>
          </div>
        </div>
        <div className="ds-help-list">
          <div className="ds-help-list-item">
            <div className="ds-help-list-icon" aria-hidden="true">
              <FiFolder className="ds-icon-sm" />
            </div>
            <div>
              <h3>Bearbeiten</h3>
              <p>
                Über „Bearbeiten“ ändern Sie Name, Farbe oder Icon. Prüfen Sie danach, ob die neue
                Bezeichnung noch zu allen zugeordneten Projekten passt.
              </p>
            </div>
          </div>
          <div className="ds-help-list-item">
            <div className="ds-help-list-icon" aria-hidden="true">
              <FiFolder className="ds-icon-sm" />
            </div>
            <div>
              <h3>Zusammenführen</h3>
              <p>
                Eine automatische Zusammenführung gibt es nicht. Ordnen Sie betroffene Projekte
                einzeln der Zielkategorie zu und kontrollieren Sie die Roadmap, bevor Sie die alte
                Kategorie entfernen.
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
                Der erste Klick aktiviert „Bestätigen“. Prüfen Sie vorher alle Projektzuordnungen;
                die Adminoberfläche bietet keine Funktion zum Wiederherstellen gelöschter
                Kategorien.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-card ds-help-support-panel" aria-labelledby="kontrolle-heading">
        <div>
          <p className="ds-panel-label">Qualitätskontrolle</p>
          <h2 id="kontrolle-heading" className="ds-section-title">
            Mit der Perspektive der Nutzenden prüfen
          </h2>
          <p className="ds-section-copy">
            Kann eine neue Person anhand der Kategorien entscheiden, wo sie suchen soll? Falls zwei
            Kategorien dieselbe Erwartung wecken oder eine Kategorie sehr viele unterschiedliche
            Projekte sammelt, sollte die Struktur fachlich überprüft werden.
          </p>
        </div>
        <div className="ds-actions ds-help-support-actions">
          <Link className="ds-button ds-button-primary" href="/roadmap">
            Roadmap kontrollieren
          </Link>
          <Link className="ds-button ds-button-secondary" href="/help/admin/projekte-verwalten">
            Projekte neu zuordnen
          </Link>
        </div>
      </section>
    </HelpLayout>
  );
};

export default KategorienVerwalten;
