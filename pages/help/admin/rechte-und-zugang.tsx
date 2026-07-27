import Link from 'next/link';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import { FiArrowRight, FiEye, FiLock, FiShield, FiUserCheck } from 'react-icons/fi';
import HelpLayout from '@/components/HelpLayout';

const accessLevels = [
  {
    title: 'Lesender Zugriff',
    description:
      'Die Sichtbarkeit einer Roadmap kann anhand der für die Instanz freigegebenen Abteilungen gesteuert werden. Leserechte erlauben keine Pflege im Adminbereich.',
    icon: FiEye,
  },
  {
    title: 'Instanz-Admin',
    description:
      'Darf die betreffende Instanz administrieren. Die Berechtigung kann über die Admin-Liste der Instanz oder eine konfigurierte Admin-Gruppe entstehen.',
    icon: FiUserCheck,
  },
  {
    title: 'Superadmin',
    description:
      'Besitzt weitergehende Rechte über Instanzen hinweg. Diese Rolle ist nicht für die gewöhnliche Projektpflege vorgesehen.',
    icon: FiShield,
  },
];

const RechteUndZugang = () => {
  return (
    <HelpLayout
      eyebrow="Admin-Handbuch"
      title="Rechte und Zugang nachvollziehbar verwalten"
      description={
        <>
          Die Anmeldung erfolgt über Microsoft SSO. Danach prüft die Anwendung, welche Instanzen
          eine Person sehen oder administrieren darf. Vergeben Sie nur die kleinste benötigte
          Berechtigung und prüfen Sie regelmäßig, ob sie weiterhin erforderlich ist.
        </>
      }
      breadcrumbs={[
        { label: 'Hilfe', href: '/help' },
        { label: 'Admin', href: '/help/admin' },
        { label: 'Rechte & Zugang' },
      ]}
      learningGoals={[
        'Microsoft-Anmeldung und eigentliche Berechtigung unterscheiden.',
        'Leserecht, Instanz-Admin und Superadmin korrekt einordnen.',
        'Eine Person gezielt als Admin der aktiven Instanz hinzufügen.',
        'Fehlenden Zugriff mit aussagekräftigen Angaben melden.',
      ]}
      actions={
        <>
          <Link className="ds-button ds-button-primary" href="/admin/login">
            Microsoft-Anmeldung öffnen
            <FiArrowRight className="ds-icon-sm" />
          </Link>
          <Link className="ds-button ds-button-secondary" href="/support">
            Zugriffsproblem melden
          </Link>
        </>
      }
    >
      <section aria-labelledby="modell-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Berechtigungsmodell</p>
            <h2 id="modell-heading" className="ds-section-title">
              Anmeldung allein gibt noch keine Admin-Rechte
            </h2>
          </div>
          <p className="ds-section-copy">
            Microsoft SSO bestätigt die Identität. Erst die anschließende Rollen- und Instanzprüfung
            entscheidet über den tatsächlichen Zugriff.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {accessLevels.map((level) => (
            <article key={level.title} className="ds-card ds-help-card">
              <div className="ds-help-card-header">
                <div className="ds-help-card-icon" aria-hidden="true">
                  <level.icon className="ds-icon-sm" />
                </div>
              </div>
              <h3 className="ds-help-card-title">{level.title}</h3>
              <p className="ds-help-card-copy">{level.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="vergeben-heading">
        <div className="ds-section-header">
          <div>
            <p className="ds-panel-label">Instanz-Admin hinzufügen</p>
            <h2 id="vergeben-heading" className="ds-section-title">
              Zugriff gezielt für eine Instanz vergeben
            </h2>
          </div>
        </div>
        <div className="ds-steps">
          {[
            {
              title: 'Bedarf und Instanz klären',
              copy: 'Bestätigen Sie, dass die Person Inhalte wirklich pflegen muss und für welche konkrete Instanz die Berechtigung benötigt wird.',
            },
            {
              title: 'Admin-Dashboard der Zielinstanz öffnen',
              copy: 'Kontrollieren Sie die Anzeige „Aktive Instanz“. Eine Berechtigung in der falschen Instanz löst das Zugriffsproblem nicht.',
            },
            {
              title: 'Person im Benutzerfeld auswählen',
              copy: 'Suchen Sie unter „Instanz-Admins“ nach der Person und wählen Sie den passenden SharePoint-Benutzereintrag aus.',
            },
            {
              title: 'Zugriff gemeinsam prüfen',
              copy: 'Die Person meldet sich mit Microsoft SSO an und öffnet die Zielinstanz. Prüfen Sie, ob Admin-Dashboard und Bearbeitungsaktionen verfügbar sind.',
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
        <div className="ds-note">
          <span className="ds-note-icon" aria-hidden="true">
            i
          </span>
          <p className="ds-step-copy">
            Entfernen Sie nicht mehr benötigte Instanz-Admins über „Entfernen“. Die Anwendung fragt
            vor dem Entfernen nochmals nach einer Bestätigung.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2" aria-label="Anmeldung und Fehlerhilfe">
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiLock className="ds-icon-sm" />
            </div>
          </div>
          <h2 className="ds-help-card-title">Sicher anmelden</h2>
          <p className="ds-help-card-copy">
            Nutzen Sie Ihr persönliches Microsoft-Konto. Teilen Sie keine Sitzung, kein Passwort und
            keinen Zugangstoken. Wird das Anmelde-Popup blockiert, erlauben Sie Popups für diese
            Website und versuchen Sie es erneut.
          </p>
        </article>
        <article className="ds-card ds-help-card">
          <div className="ds-help-card-header">
            <div className="ds-help-card-icon" aria-hidden="true">
              <FiShield className="ds-icon-sm" />
            </div>
          </div>
          <h2 className="ds-help-card-title">Zugriffsfehler eingrenzen</h2>
          <p className="ds-help-card-copy">
            Nennen Sie dem Support Ihre geschäftliche Benutzerkennung, die betroffene Instanz, den
            aufgerufenen Link und den exakten Meldungstext. Senden Sie niemals Kennwörter oder
            Tokens mit.
          </p>
        </article>
      </section>

      <section className="ds-card ds-help-support-panel" aria-labelledby="prinzip-heading">
        <div>
          <p className="ds-panel-label">Minimalprinzip</p>
          <h2 id="prinzip-heading" className="ds-section-title">
            So viel Zugriff wie nötig, so wenig wie möglich
          </h2>
          <p className="ds-section-copy">
            Lesender Zugriff reicht, wenn eine Person Roadmaps nur ansehen muss. Admin-Rechte sind
            für aktive Pflegeaufgaben gedacht und sollten bei Rollenwechsel oder Aufgabenende
            zeitnah entfernt werden.
          </p>
        </div>
        <div className="ds-actions ds-help-support-actions">
          <Link className="ds-button ds-button-primary" href="/admin">
            Admin-Liste prüfen
          </Link>
          <Link className="ds-button ds-button-secondary" href="/help/faq">
            Zugriffs-FAQ
          </Link>
        </div>
      </section>
    </HelpLayout>
  );
};

export default RechteUndZugang;
