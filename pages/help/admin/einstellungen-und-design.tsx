import Link from 'next/link';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import { FiArrowRight, FiEdit3, FiEye, FiSettings } from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

const visibleSettings = [
  {
    key: 'siteTitle',
    effect: 'Legt den Titel im Kopf der Roadmap fest.',
    example: 'Digitalisierungs-Roadmap',
  },
  {
    key: 'gradientFrom',
    effect: 'Bestimmt die erste Farbe des Titelverlaufs.',
    example: '#eab308',
  },
  {
    key: 'gradientTo',
    effect: 'Bestimmt die zweite Farbe des Titelverlaufs.',
    example: '#b45309',
  },
];

const EinstellungenUndDesign = () => {
  return (
    <HelpLayout
      eyebrow="Admin-Handbuch"
      title="Einstellungen und sichtbares Design pflegen"
      description={
        <>
          Der Reiter „Einstellungen“ zeigt Schlüssel und Rohwerte der aktiven Instanz. Es gibt dort
          keine Vorschau und keine automatische Prüfung aller Werte. Dokumentieren Sie deshalb den
          bisherigen Wert, ändern Sie gezielt und kontrollieren Sie die Roadmap nach dem Speichern.
        </>
      }
      breadcrumbs={[
        { label: 'Hilfe', href: '/help' },
        { label: 'Admin', href: '/help/admin' },
        { label: 'Einstellungen & Design' },
      ]}
      learningGoals={[
        'Nur die Einstellung der aktiven Instanz bearbeiten.',
        'Sichtbar verwendete Schlüssel und ihr Format erkennen.',
        'Vorhandenen Wert vor einer Änderung sichern.',
        'Titel und Farbverlauf nach dem Speichern neu laden und prüfen.',
      ]}
      actions={
        <>
          <Link className="ds-button ds-button-primary" href="/admin">
            Einstellungen im Adminbereich öffnen
            <FiArrowRight className="ds-icon-sm" />
          </Link>
          <Link className="ds-button ds-button-secondary" href="/help/admin">
            Zur Admin-Übersicht
          </Link>
        </>
      }
    >
      <section aria-labelledby="ablauf-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Sicher bearbeiten</p>
            <h2 id="ablauf-heading" className="ds-section-title">
              Eine Einstellung, eine Kontrolle
            </h2>
          </div>
        </div>
        <div className="ds-steps">
          {[
            {
              title: 'Aktive Instanz bestätigen',
              copy: 'Prüfen Sie im Admin-Dashboard, welche Roadmap-Instanz aktiv ist. Einstellungen gelten instanzbezogen.',
            },
            {
              title: 'Bisherigen Wert festhalten',
              copy: 'Kopieren Sie Schlüssel und aktuellen Wert in Ihre Änderungsnotiz. Das erleichtert eine manuelle Rückkehr zum vorherigen Stand.',
            },
            {
              title: '„Bearbeiten“, Wert ändern und speichern',
              copy: 'Achten Sie auf exakte Schreibweise. Bei Farben ist ein vollständiger Hex-Wert im Format #RRGGBB die sicherste Eingabe.',
            },
            {
              title: 'Roadmap neu laden und vergleichen',
              copy: 'Öffnen oder aktualisieren Sie dieselbe Instanz. Prüfen Sie Desktop und Mobilansicht sowie die Lesbarkeit des Titels.',
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

      <section aria-labelledby="schluessel-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Sichtbare Wirkung</p>
            <h2 id="schluessel-heading" className="ds-section-title">
              Diese Werte nutzt der Roadmap-Kopf
            </h2>
          </div>
          <p className="ds-section-copy">
            Bearbeiten Sie nur Schlüssel, deren Zweck Sie kennen. Weitere Einträge können technische
            Funktionen steuern und gehören nicht zu einer rein visuellen Anpassung.
          </p>
        </div>
        <div className="ds-help-list">
          {visibleSettings.map((setting) => (
            <div key={setting.key} className="ds-help-list-item">
              <div className="ds-help-list-icon" aria-hidden="true">
                <FiSettings className="ds-icon-sm" />
              </div>
              <div>
                <h3>{setting.key}</h3>
                <p>
                  {setting.effect} Beispiel: <code>{setting.example}</code>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2" aria-label="Designprüfung">
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiEdit3 className="ds-icon-sm" />
            </div>
          </div>
          <h2 className="ds-help-card-title">Titel verständlich formulieren</h2>
          <p className="ds-help-card-copy">
            Nennen Sie Bereich oder Zweck so, dass Personen die Instanz sofort einordnen können.
            Vermeiden Sie lange Slogans, unbekannte Abkürzungen und wechselnde Begriffe für dasselbe
            Portfolio.
          </p>
        </article>
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiEye className="ds-icon-sm" />
            </div>
          </div>
          <h2 className="ds-help-card-title">Farbverlauf lesbar halten</h2>
          <p className="ds-help-card-copy">
            Die Farben werden auf den Titeltext angewendet. Wählen Sie deshalb zwei ausreichend
            helle, unterscheidbare Werte und prüfen Sie den gesamten Titel auf dem dunklen
            Hintergrund – auch bei kleiner Bildschirmbreite.
          </p>
        </article>
      </section>

      <section className="ds-card ds-help-support-panel" aria-labelledby="fehler-heading">
        <div>
          <p className="ds-panel-label">Wenn die Änderung nicht erscheint</p>
          <h2 id="fehler-heading" className="ds-section-title">
            Instanz, Wert und Neuladen prüfen
          </h2>
          <p className="ds-section-copy">
            Kontrollieren Sie zuerst, ob Sie dieselbe Instanz ansehen. Laden Sie die Roadmap neu und
            vergleichen Sie den gespeicherten Wert. Bei einem ungültigen oder unlesbaren Ergebnis
            setzen Sie den zuvor notierten Wert wieder ein und holen technische Unterstützung.
          </p>
        </div>
        <div className="ds-actions ds-help-support-actions">
          <Link className="ds-button ds-button-primary" href="/roadmap">
            Darstellung prüfen
          </Link>
          <Link className="ds-button ds-button-secondary" href="/support">
            Support kontaktieren
          </Link>
        </div>
      </section>
    </HelpLayout>
  );
};

export default EinstellungenUndDesign;
