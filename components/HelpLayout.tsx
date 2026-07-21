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
      <div className="ds-page-shell">
        <SiteHeader activeRoute="help" />

        <main className="ds-page-main">
          <section className="ds-container ds-hero ds-help-hero">
            <div className="ds-hero-content">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="ds-badge-row">
                  {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return isLast || !crumb.href ? (
                      <span key={crumb.label} className="ds-badge ds-badge-success">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link key={crumb.label} className="ds-badge" href={crumb.href}>
                        {crumb.label}
                      </Link>
                    );
                  })}
                </nav>
              )}

              <div className="ds-eyebrow">
                <FiBookOpen className="ds-icon-sm" />
                {eyebrow}
              </div>
              <h1 className="ds-hero-title">{title}</h1>
              {description && <div className="ds-hero-copy">{description}</div>}
              {actions && <div className="ds-actions">{actions}</div>}
            </div>

            {learningGoals && learningGoals.length > 0 && (
              <aside className="ds-card ds-logic-panel" aria-label="Seitenübersicht">
                <div className="ds-panel-header">
                  <div>
                    <p className="ds-panel-label">Schnelle Orientierung</p>
                    <h2 className="ds-panel-title">{overviewTitle}</h2>
                  </div>
                  <div className="ds-panel-icon" aria-hidden="true">
                    <FiCheckCircle className="ds-icon-md" />
                  </div>
                </div>
                <div className="ds-info-list">
                  {learningGoals.map((goal) => (
                    <p key={goal} className="ds-info-item">
                      {goal}
                    </p>
                  ))}
                </div>
              </aside>
            )}
          </section>

          <div className="ds-container ds-section ds-help-knowledge-section">
            <div className={`mx-auto w-full ${maxWidthClassName} space-y-12`}>{children}</div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
};

export default HelpLayout;
