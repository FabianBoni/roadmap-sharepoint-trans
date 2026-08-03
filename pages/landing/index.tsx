import Head from 'next/head';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import Link from 'next/link';
import {
  FiArrowUpRight,
  FiCheckCircle,
  FiCompass,
  FiGrid,
  FiLayers,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import SiteHeader from '@/components/SiteHeader';

const valueProps = [
  {
    title: 'Zentrale Transparenz',
    icon: FiLayers,
    description:
      'Roadmaps, Statusstände und Verantwortlichkeiten werden an einem Ort gebündelt und bleiben für Stakeholder nachvollziehbar.',
  },
  {
    title: 'SharePoint als Quelle',
    icon: FiShield,
    description:
      'Die Applikation nutzt die bestehende SharePoint-Struktur weiter, inklusive Rollen, Listen und vorhandenen Betriebsprozessen.',
  },
  {
    title: 'Schneller Zugang pro Instanz',
    icon: FiCompass,
    description:
      'Benutzer öffnen genau die Instanz, für die sie freigeschaltet sind, ohne manuell zwischen verschiedenen Umgebungen wechseln zu müssen.',
  },
];

const workflowSteps = [
  {
    title: 'Zugang prüfen',
    description: 'Benutzer melden sich an und sehen nur die Instanzen, für die Freigaben bestehen.',
  },
  {
    title: 'Instanz öffnen',
    description: 'Die passende Roadmap wird gezielt im separaten Übersichtsfenster ausgewählt.',
  },
  {
    title: 'Vorhaben steuern',
    description:
      'Status, Kategorien, Zuständigkeiten und Prioritäten bleiben für alle Rollen sichtbar.',
  },
];

const spotlightStats = [
  { label: 'Mehrinstanzfähig', value: 'Polizei, Feuerwehr, Rettungsdienste' },
  { label: 'Datenhaltung', value: 'SharePoint' },
  { label: 'Zugriffsmodell', value: 'Rollenbasiert' },
];

const audienceCards = [
  {
    title: 'Fachbereiche',
    description:
      'Verfolgen Prioritäten, Abhängigkeiten und geplante Deliverables in ihrer Instanz.',
  },
  {
    title: 'Portfoliosteuerung',
    description: 'Erhält einen belastbaren Überblick über Status, Reifegrad und Steuerungsbedarf.',
  },
  {
    title: 'Instanz-Admins',
    description: 'Pflegen Projekte, Kategorien und Inhalte innerhalb ihres abgegrenzten Bereichs.',
  },
  {
    title: 'Superadmins',
    description: 'Steuern Instanzen, technische Konfiguration und zentrale Zugriffslogik.',
  },
];

const LandingPage = () => {
  return (
    <>
      <Head>
        <title>JSDoIT Roadmap</title>
      </Head>
      <div className="ds-page-shell before:[position:absolute] before:[inset:0] before:[z-index:0] before:[pointer-events:none] before:[background-image:linear-gradient(var(--ds-grid-line)_1px,_transparent_1px),_linear-gradient(90deg,_var(--ds-grid-line)_1px,_transparent_1px)] before:[background-size:56px_56px] before:[mask-image:linear-gradient(to_bottom,_black,_rgba(0,_0,_0,_0.72),_transparent_98%)] after:[position:absolute] after:[right:-10%] after:[bottom:-25%] after:[left:-10%] after:[z-index:0] after:[height:38vh] after:[pointer-events:none] after:[background:radial-gradient(ellipse_at_center,_var(--ds-hero-glow-a),_transparent_62%)] after:[filter:blur(12px)] [position:relative] [isolation:isolate] [display:flex] [min-height:100vh] [flex-direction:column] [overflow:hidden] [background:radial-gradient(circle_at_7%_18%,_var(--ds-hero-glow-a),_transparent_31%),_radial-gradient(circle_at_70%_8%,_var(--ds-hero-glow-b),_transparent_28%),_radial-gradient(circle_at_48%_86%,_var(--ds-hero-glow-c),_transparent_26%),_linear-gradient(135deg,_var(--ds-bg-page),_var(--ds-bg-page-2))] [color:var(--ds-text-default)] [font-family:var(--ds-font-sans)] [&>*]:[position:relative] [&>*]:[z-index:1]">
        <SiteHeader activeRoute="home" />

        <main className="ds-page-main [flex:1]">
          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-hero [display:grid] [min-height:calc(100vh_-_78px)] [grid-template-columns:minmax(0,_1.08fr)_minmax(420px,_0.92fr)] [align-items:center] [gap:clamp(40px,_6vw,_86px)] [padding-block:clamp(56px,_7vw,_96px)] max-[1100px]:[grid-template-columns:1fr] max-[760px]:[padding-block:42px]">
            <div className="ds-hero-content [max-width:760px]">
              <div className="ds-eyebrow [display:inline-flex] [width:fit-content] [align-items:center] [gap:10px] [padding:9px_15px] [border:1px_solid_var(--ds-border-strong)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-accent-soft)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.22em] [text-transform:uppercase] [&_svg]:[color:var(--ds-accent-strong)]">
                <FiGrid className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                JSDoIT Roadmap Center
              </div>

              <h1 className="ds-hero-title [max-width:760px] [margin:28px_0_22px] [color:var(--ds-text-strong)] [font-size:clamp(2.625rem,_5.8vw,_4.75rem)] [font-weight:860] [letter-spacing:-0.06em] [line-height:0.98] [text-wrap:balance]">
                Roadmaps, Prioritäten und Instanzen in einer{' '}
                <span className="ds-accent-text bg-clip-text text-transparent [-webkit-text-fill-color:transparent] [background-image:linear-gradient(_90deg,_var(--ds-text-strong),_var(--ds-accent-strong),_var(--ds-accent-2)_)]">
                  klaren Einstiegsebene
                </span>
              </h1>
              <p className="ds-hero-copy [max-width:660px] [margin:0] [color:var(--ds-text-default)] [font-size:1.0625rem] [line-height:1.75]">
                Die Anwendung verbindet SharePoint-basierte Roadmap-Daten mit einer zentralen,
                verständlichen Oberfläche. Fachbereiche, Steuerung und Administration starten von
                hier aus in die richtige Instanz und behalten gleichzeitig den Gesamtzweck der
                Plattform im Blick.
              </p>

              <div className="ds-actions [display:flex] [flex-wrap:wrap] [align-items:center] [gap:var(--ds-space-4)] [margin-top:30px] max-[760px]:[&_.ds-button]:[width:100%]">
                <Link
                  href="/instances"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-primary [background:linear-gradient(_135deg,_var(--ds-accent),_var(--ds-accent-2)_58%,_var(--ds-accent-strong)_)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-inverse)]"
                >
                  <FiGrid className="ds-icon [flex:0_0_auto] [width:1.125rem] [height:1.125rem]" />
                  Instanzübersicht öffnen
                  <FiArrowUpRight className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                </Link>
                <Link
                  href="/help"
                  className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-secondary [border-color:var(--ds-border-default)] [background:var(--ds-bg-elevated)] [box-shadow:var(--ds-shadow-card)] [color:var(--ds-text-strong)]"
                >
                  Mehr zur Nutzung
                </Link>
              </div>

              <div className="ds-feature-grid [display:grid] [max-width:760px] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:var(--ds-space-4)] [margin-top:34px] max-[760px]:[grid-template-columns:1fr]">
                {spotlightStats.map((stat, index) => (
                  <article
                    key={stat.label}
                    className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-feature-card [min-height:164px] [padding:22px]"
                  >
                    <div className="ds-icon-box [display:grid] [width:38px] [height:38px] [place-items:center] [margin-bottom:22px] [border:1px_solid_var(--ds-border-default)] [border-radius:13px] [background:var(--ds-accent-soft)] [color:var(--ds-accent-strong)]">
                      0{index + 1}
                    </div>
                    <h3 className="ds-kicker [margin:0_0_9px] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.18em] [text-transform:uppercase]">
                      {stat.label}
                    </h3>
                    <p className="ds-small-text [margin:0] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.55]">
                      {stat.value}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside
              className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-logic-panel [padding:30px] [border-color:var(--ds-border-strong)] [border-radius:var(--ds-radius-xl)] [box-shadow:var(--ds-shadow-soft),_var(--ds-shadow-glow),_inset_0_1px_0_rgba(255,_255,_255,_0.06)] max-[1100px]:[max-width:760px]"
              aria-label="Plattformlogik"
            >
              <div className="ds-panel-header [display:flex] [justify-content:space-between] [gap:var(--ds-space-5)] [margin-bottom:24px] max-[760px]:[flex-direction:column-reverse]">
                <div>
                  <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                    Plattformlogik
                  </p>
                  <h2 className="ds-panel-title [margin:0] [color:var(--ds-text-strong)] [font-size:clamp(1.5rem,_3vw,_2.125rem)] [letter-spacing:-0.04em] [line-height:1.15]">
                    Ein sauberer Einstieg statt verstreuter Links
                  </h2>
                </div>
                <div
                  className="ds-panel-icon [display:grid] [flex:0_0_auto] [width:68px] [height:68px] [place-items:center] [border:1px_solid_var(--ds-border-strong)] [border-radius:24px] [background:radial-gradient(circle,_var(--ds-accent-soft),_transparent_74%)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-accent-strong)]"
                  aria-hidden="true"
                >
                  <FiTrendingUp className="ds-icon-md [flex:0_0_auto] [width:1.5rem] [height:1.5rem]" />
                </div>
              </div>

              <div className="ds-steps [display:grid] [gap:14px]">
                {workflowSteps.map((step, index) => (
                  <article
                    key={step.title}
                    className="ds-step [display:grid] [grid-template-columns:64px_1fr] [align-items:start] [gap:var(--ds-space-4)] [padding:20px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_80%,_transparent)] max-[760px]:[grid-template-columns:1fr]"
                  >
                    <div className="ds-step-number [display:grid] [width:48px] [height:48px] [place-items:center] [border:1px_solid_var(--ds-border-strong)] [border-radius:50%] [background:var(--ds-accent-soft)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-accent-strong)] [font-size:1rem] [font-weight:900]">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="ds-step-title [margin:0_0_8px] [color:var(--ds-text-strong)] [font-size:1rem] [font-weight:850]">
                        {step.title}
                      </h3>
                      <p className="ds-step-copy [margin:0] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.55]">
                        {step.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="ds-note [display:grid] [grid-template-columns:48px_1fr] [align-items:center] [gap:var(--ds-space-4)] [margin-top:18px] [padding:18px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(_135deg,_var(--ds-accent-soft),_color-mix(in_srgb,_var(--ds-bg-elevated)_86%,_transparent)_)]">
                <div className="ds-note-icon [display:grid] [width:40px] [height:40px] [place-items:center] [border:1px_solid_var(--ds-border-strong)] [border-radius:50%] [background:var(--ds-accent-soft)] [color:var(--ds-accent-strong)] [font-weight:900]">
                  i
                </div>
                <p className="ds-small-text [margin:0] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.55]">
                  Die Instanzübersicht öffnet sich bewusst separat. Dadurch bleibt diese Seite der
                  allgemeine Einstieg für Information, Orientierung und Navigation.
                </p>
              </div>
            </aside>
          </section>

          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px]">
            <div className="ds-section-header [display:flex] [align-items:end] [justify-content:space-between] [gap:var(--ds-space-6)] [margin-bottom:24px]">
              <div>
                <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                  Nutzen der Anwendung
                </p>
                <h2 className="ds-section-title [margin:0] [color:var(--ds-text-strong)] [font-size:2rem] [letter-spacing:-0.04em]">
                  Was diese Plattform im Alltag besser macht
                </h2>
              </div>
              <p className="ds-section-copy [max-width:620px] [margin:10px_0_0] [color:var(--ds-text-muted)] [line-height:1.65]">
                Das Roadmap Center dient als gemeinsamer Zugangspunkt für verteilte Roadmap-
                Instanzen. Inhalte können zentral präsentiert werden, während die Datenhaltung und
                Berechtigungen an die vorhandene SharePoint-Landschaft angebunden bleiben.
              </p>
            </div>

            <div className="ds-value-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:var(--ds-space-6)] [margin-top:48px] max-[1100px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[760px]:[grid-template-columns:1fr]">
              {valueProps.map((item) => (
                <article
                  key={item.title}
                  className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-value-card [padding:24px] [transition:transform_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out)] hover:[border-color:var(--ds-border-strong)] hover:[box-shadow:var(--ds-shadow-soft),_var(--ds-shadow-glow)] hover:[transform:translateY(-2px)]"
                >
                  <div className="ds-value-icon [display:grid] [width:48px] [height:48px] [place-items:center] [margin-bottom:22px] [border:1px_solid_var(--ds-border-default)] [border-radius:16px] [background:linear-gradient(135deg,_var(--ds-accent-soft),_var(--ds-bg-muted))] [color:var(--ds-accent-strong)]">
                    <item.icon className="ds-icon [flex:0_0_auto] [width:1.125rem] [height:1.125rem]" />
                  </div>
                  <h3 className="ds-value-title [margin:0] [color:var(--ds-text-strong)] [font-size:1.125rem] [font-weight:800]">
                    {item.title}
                  </h3>
                  <p className="ds-value-copy [margin:14px_0_0] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.7]">
                    {item.description}
                  </p>
                  <div className="ds-proof-line [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [margin-top:24px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.18em] [text-transform:uppercase]">
                    <FiCheckCircle className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                    Für den produktiven Einsatz
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px]">
            <div className="ds-audience-panel [display:grid] [grid-template-columns:minmax(0,_0.88fr)_minmax(0,_1.12fr)] [gap:40px] [padding:clamp(32px,_4vw,_40px)] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-xl)] [background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_color-mix(in_srgb,_var(--ds-bg-page)_72%,_transparent)_)] [box-shadow:var(--ds-shadow-soft)] max-[1100px]:[grid-template-columns:1fr]">
              <div className="ds-audience-intro [display:grid] [align-content:start] [gap:var(--ds-space-5)]">
                <div className="ds-eyebrow [display:inline-flex] [width:fit-content] [align-items:center] [gap:10px] [padding:9px_15px] [border:1px_solid_var(--ds-border-strong)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-accent-soft)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.22em] [text-transform:uppercase] [&_svg]:[color:var(--ds-accent-strong)]">
                  <FiUsers className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                  Für wen die Plattform gedacht ist
                </div>
                <h2 className="ds-section-title [margin:0] [color:var(--ds-text-strong)] [font-size:2rem] [letter-spacing:-0.04em]">
                  Geeignet für Fachbereiche, Portfoliosteuerung und Administration
                </h2>
                <p className="ds-section-copy [max-width:620px] [margin:10px_0_0] [color:var(--ds-text-muted)] [line-height:1.65]">
                  Die Anwendung unterstützt reine Leserollen ebenso wie operative Pflege und
                  übergreifende Governance. Das Design trennt Information, Navigation und Zugriff
                  klar, damit die Oberfläche auch bei mehreren Instanzen verständlich bleibt.
                </p>
              </div>
              <div className="ds-audience-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:var(--ds-space-4)] max-[760px]:[grid-template-columns:1fr]">
                {audienceCards.map((item) => (
                  <div
                    key={item.title}
                    className="ds-audience-card [padding:20px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-lg)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_76%,_transparent)] [transition:background_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out)] hover:[border-color:var(--ds-border-strong)] hover:[background:var(--ds-bg-elevated-strong)]"
                  >
                    <p className="ds-audience-title [margin:0] [color:var(--ds-text-strong)] [font-size:0.875rem] [font-weight:800]">
                      {item.title}
                    </p>
                    <p className="ds-audience-copy [margin:12px_0_0] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.55]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="ds-footer [border-top:1px_solid_var(--ds-border-subtle)] [background:color-mix(in_srgb,_var(--ds-bg-page)_82%,_transparent)] [backdrop-filter:blur(18px)]">
          <div className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-footer-inner [display:flex] [align-items:center] [justify-content:space-between] [gap:var(--ds-space-4)] [padding-block:24px] [color:var(--ds-text-muted)] [font-size:0.875rem] max-[760px]:[align-items:flex-start] max-[760px]:[flex-direction:column]">
            <span>JSDoIT Roadmap Center</span>
            <div className="ds-footer-links [display:flex] [flex-wrap:wrap] [align-items:center] [gap:var(--ds-space-4)]">
              <Link
                className="ds-footer-link [color:var(--ds-text-muted)] [font-weight:700] [transition:color_var(--ds-duration-fast)_var(--ds-ease-out)] hover:[color:var(--ds-text-strong)]"
                href="/help"
              >
                Hilfe
              </Link>
              <Link
                className="ds-footer-link [color:var(--ds-text-muted)] [font-weight:700] [transition:color_var(--ds-duration-fast)_var(--ds-ease-out)] hover:[color:var(--ds-text-strong)]"
                href="/feedback"
              >
                Feedback
              </Link>
              <Link
                className="ds-footer-link [color:var(--ds-text-muted)] [font-weight:700] [transition:color_var(--ds-duration-fast)_var(--ds-ease-out)] hover:[color:var(--ds-text-strong)]"
                href="/instances"
              >
                Instanzen
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
