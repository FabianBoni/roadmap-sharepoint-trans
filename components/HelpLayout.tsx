import Head from 'next/head';
import Link from 'next/link';
import React, { ReactNode } from 'react';
import { FiBookOpen, FiCheckCircle } from 'react-icons/fi';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

type HelpLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  learningGoals?: string[];
  overviewTitle?: string;
  children: ReactNode;
  maxWidthClassName?: string;
};

const HelpLayout: React.FC<HelpLayoutProps> = ({
  eyebrow = 'Hilfe & Support',
  title,
  description,
  actions,
  breadcrumbs,
  learningGoals,
  overviewTitle = 'Das finden Sie auf dieser Seite',
  children,
  maxWidthClassName = 'max-w-5xl',
}) => {
  return (
    <>
      <Head>
        <title>{title} | Hilfe | JSDoIT Roadmap</title>
      </Head>
      <div className="ds-page-shell before:[position:absolute] before:[inset:0] before:[z-index:0] before:[pointer-events:none] before:[background-image:linear-gradient(var(--ds-grid-line)_1px,_transparent_1px),_linear-gradient(90deg,_var(--ds-grid-line)_1px,_transparent_1px)] before:[background-size:56px_56px] before:[mask-image:linear-gradient(to_bottom,_black,_rgba(0,_0,_0,_0.72),_transparent_98%)] after:[position:absolute] after:[right:-10%] after:[bottom:-25%] after:[left:-10%] after:[z-index:0] after:[height:38vh] after:[pointer-events:none] after:[background:radial-gradient(ellipse_at_center,_var(--ds-hero-glow-a),_transparent_62%)] after:[filter:blur(12px)] [position:relative] [isolation:isolate] [display:flex] [min-height:100vh] [flex-direction:column] [overflow:hidden] [background:radial-gradient(circle_at_7%_18%,_var(--ds-hero-glow-a),_transparent_31%),_radial-gradient(circle_at_70%_8%,_var(--ds-hero-glow-b),_transparent_28%),_radial-gradient(circle_at_48%_86%,_var(--ds-hero-glow-c),_transparent_26%),_linear-gradient(135deg,_var(--ds-bg-page),_var(--ds-bg-page-2))] [color:var(--ds-text-default)] [font-family:var(--ds-font-sans)] [&>*]:[position:relative] [&>*]:[z-index:1]">
        <SiteHeader activeRoute="help" />

        <main className="ds-page-main [flex:1]">
          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-hero [display:grid] [min-height:calc(100vh_-_78px)] [grid-template-columns:minmax(0,_1.08fr)_minmax(420px,_0.92fr)] [align-items:center] [gap:clamp(40px,_6vw,_86px)] [padding-block:clamp(56px,_7vw,_96px)] max-[1100px]:[grid-template-columns:1fr] max-[760px]:[padding-block:42px] ds-help-hero [min-height:auto] [padding-block:clamp(48px,_7vw,_88px)]">
            <div className="ds-hero-content [max-width:760px]">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav
                  aria-label="Breadcrumb"
                  className="ds-badge-row [display:flex] [flex-wrap:wrap] [gap:10px]"
                >
                  {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return isLast || !crumb.href ? (
                      <span
                        key={crumb.label}
                        className="ds-badge [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [padding:7px_10px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-bg-soft)] [color:var(--ds-text-default)] [font-size:0.75rem] [font-weight:750] ds-badge-success [background:color-mix(in_srgb,_var(--ds-success)_13%,_transparent)] [color:var(--ds-success)]"
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        key={crumb.label}
                        className="ds-badge [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [padding:7px_10px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-bg-soft)] [color:var(--ds-text-default)] [font-size:0.75rem] [font-weight:750]"
                        href={crumb.href}
                      >
                        {crumb.label}
                      </Link>
                    );
                  })}
                </nav>
              )}

              <div className="ds-eyebrow [display:inline-flex] [width:fit-content] [align-items:center] [gap:10px] [padding:9px_15px] [border:1px_solid_var(--ds-border-strong)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-accent-soft)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.22em] [text-transform:uppercase] [&_svg]:[color:var(--ds-accent-strong)]">
                <FiBookOpen className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                {eyebrow}
              </div>
              <h1 className="ds-hero-title [max-width:760px] [margin:28px_0_22px] [color:var(--ds-text-strong)] [font-size:clamp(2.625rem,_5.8vw,_4.75rem)] [font-weight:860] [letter-spacing:-0.06em] [line-height:0.98] [text-wrap:balance]">
                {title}
              </h1>
              {description && (
                <div className="ds-hero-copy [max-width:660px] [margin:0] [color:var(--ds-text-default)] [font-size:1.0625rem] [line-height:1.75]">
                  {description}
                </div>
              )}
              {actions && (
                <div className="ds-actions [display:flex] [flex-wrap:wrap] [align-items:center] [gap:var(--ds-space-4)] [margin-top:30px] max-[760px]:[&_.ds-button]:[width:100%]">
                  {actions}
                </div>
              )}
            </div>

            {learningGoals && learningGoals.length > 0 && (
              <aside
                className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-logic-panel [padding:30px] [border-color:var(--ds-border-strong)] [border-radius:var(--ds-radius-xl)] [box-shadow:var(--ds-shadow-soft),_var(--ds-shadow-glow),_inset_0_1px_0_rgba(255,_255,_255,_0.06)] max-[1100px]:[max-width:760px]"
                aria-label="Seitenübersicht"
              >
                <div className="ds-panel-header [display:flex] [justify-content:space-between] [gap:var(--ds-space-5)] [margin-bottom:24px] max-[760px]:[flex-direction:column-reverse]">
                  <div>
                    <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                      Schnelle Orientierung
                    </p>
                    <h2 className="ds-panel-title [margin:0] [color:var(--ds-text-strong)] [font-size:clamp(1.5rem,_3vw,_2.125rem)] [letter-spacing:-0.04em] [line-height:1.15]">
                      {overviewTitle}
                    </h2>
                  </div>
                  <div
                    className="ds-panel-icon [display:grid] [flex:0_0_auto] [width:68px] [height:68px] [place-items:center] [border:1px_solid_var(--ds-border-strong)] [border-radius:24px] [background:radial-gradient(circle,_var(--ds-accent-soft),_transparent_74%)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-accent-strong)]"
                    aria-hidden="true"
                  >
                    <FiCheckCircle className="ds-icon-md [flex:0_0_auto] [width:1.5rem] [height:1.5rem]" />
                  </div>
                </div>
                <div className="ds-info-list [display:grid] [gap:var(--ds-space-3)]">
                  {learningGoals.map((goal) => (
                    <p
                      key={goal}
                      className="ds-info-item [margin:0] [padding:16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_72%,_transparent)] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.6]"
                    >
                      {goal}
                    </p>
                  ))}
                </div>
              </aside>
            )}
          </section>

          <div className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px] ds-help-knowledge-section [padding-top:0]">
            <div className={`mx-auto w-full ${maxWidthClassName} space-y-12`}>{children}</div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
};

export default HelpLayout;
