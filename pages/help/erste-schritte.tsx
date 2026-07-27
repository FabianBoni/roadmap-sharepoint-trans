import Head from 'next/head';
import { forceServerSideRendering } from '@/utils/serverRendering';

export const getServerSideProps = forceServerSideRendering;
import Link from 'next/link';
import {
  FiArrowRight,
  FiBookOpen,
  FiCompass,
  FiEye,
  FiFilter,
  FiGrid,
  FiLayers,
  FiMousePointer,
  FiSearch,
} from 'react-icons/fi';
import CategorySidebar from '@/components/CategorySidebar';
import CompactProjectCard from '@/components/CompactProjectCard';
import RoadmapFilters from '@/components/RoadmapFilters';
import RoadmapYearNavigation from '@/components/RoadmapYearNavigation';
import SiteHeader from '@/components/SiteHeader';
import type { Category, Project } from '@/types';

type Step = {
  title: string;
  description: string;
  details: string[];
  icon: typeof FiBookOpen;
};

const learningGoals = [
  'Die wichtigsten Elemente der Benutzeroberfläche kennen.',
  'Projekte gezielt finden, filtern und vergleichen.',
  'Projekt-Details nutzen, um Abläufe und Zuständigkeiten zu verstehen.',
  'Zwischen Ansichten wechseln und eigene Favoriten merken.',
];

const screenshotMarkers = {
  overview: [
    {
      number: '1',
      title: 'Roadmap-Kopf',
      description: 'Titel, Jahr und Projektzahl entsprechen dem Kopfbereich der echten Roadmap.',
    },
    {
      number: '2',
      title: 'Ansichten & Jahr',
      description: 'Zeitstrahl, Kacheln, Skalen und Jahresnavigation nutzen dieselben Controls.',
    },
    {
      number: '3',
      title: 'Zeitstrahl',
      description: 'Kategorien, Quartale und Projektbalken sind wie auf /roadmap aufgebaut.',
    },
  ],
  filters: [
    {
      number: '1',
      title: 'Erweiterte Filter',
      description: 'Der Filterblock ist die echte Roadmap-Filterkomponente im Standardzustand.',
    },
    {
      number: '2',
      title: 'Bereiche',
      description: 'Die Seitenleiste verwendet dieselbe Kategorie-Komponente wie die Roadmap.',
    },
    {
      number: '3',
      title: 'Kachelansicht',
      description: 'Die Projektkarten sind die echten kompakten Roadmap-Karten.',
    },
  ],
};

const mockCategories: Category[] = [
  {
    id: 'digital-workplace',
    name: 'Digital Workplace',
    color: '#20d6ff',
    icon: 'FiMonitor',
  },
  {
    id: 'daten-analyse',
    name: 'Daten & Analyse',
    color: '#37f2d0',
    icon: 'FiBarChart2',
  },
  {
    id: 'sicherheit',
    name: 'Sicherheit',
    color: '#ffcc66',
    icon: 'FiShield',
  },
];

const mockProjects: Project[] = [
  {
    id: 'mock-modern-workplace',
    title: 'Modern Workplace Rollout',
    projectType: 'long',
    category: 'digital-workplace',
    startQuarter: 'Q1',
    endQuarter: 'Q3',
    description: 'Pilot, Schulung und Rollout der modernen Arbeitsumgebung.',
    status: 'in-progress',
    ProjectFields: ['Arbeitsplatz', 'Rollout'],
    badges: ['Pilot'],
    projektleitung: 'Lea Demo',
    teamMembers: [{ id: 'tm-1', name: 'Mara Demo', role: 'Change' }],
    bisher: '',
    zukunft: '',
    fortschritt: 68,
    geplante_umsetzung: '2026',
    budget: '120000',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-09-30T23:59:59.000Z',
    links: [{ id: 'lnk-1', title: 'Pilotkonzept', url: 'https://example.invalid/pilot' }],
    projektphase: 'realisierung',
    naechster_meilenstein: 'Pilotabschluss',
  },
  {
    id: 'mock-service-portal',
    title: 'Service Portal',
    projectType: 'long',
    category: 'digital-workplace',
    startQuarter: 'Q2',
    endQuarter: 'Q4',
    description: 'Zentraler Einstieg für Supportanfragen und interne Services.',
    status: 'planned',
    ProjectFields: ['Service', 'Portal'],
    badges: ['Strategisch'],
    projektleitung: 'Noel Demo',
    teamMembers: [{ id: 'tm-2', name: 'Nina Demo', role: 'Product Owner' }],
    bisher: '',
    zukunft: '',
    fortschritt: 20,
    geplante_umsetzung: '2026',
    budget: '90000',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    links: [{ id: 'lnk-2', title: 'Backlog', url: 'https://example.invalid/backlog' }],
    projektphase: 'konzept',
    naechster_meilenstein: 'MVP Scope',
  },
  {
    id: 'mock-data-quality',
    title: 'Datenqualität Cockpit',
    projectType: 'short',
    category: 'daten-analyse',
    startQuarter: 'Q1',
    endQuarter: 'Q2',
    description: 'Kennzahlen und Datenqualität für Steuerungsgremien sichtbar machen.',
    status: 'completed',
    ProjectFields: ['Reporting', 'Daten'],
    badges: ['Quick Win'],
    projektleitung: 'Eva Demo',
    teamMembers: [{ id: 'tm-3', name: 'Sam Demo', role: 'Data Engineer' }],
    bisher: '',
    zukunft: '',
    fortschritt: 100,
    geplante_umsetzung: '2026',
    budget: '45000',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.000Z',
    links: [{ id: 'lnk-3', title: 'Dashboard', url: 'https://example.invalid/dashboard' }],
    projektphase: 'abschluss',
    naechster_meilenstein: 'Abnahme',
  },
];

const noop = () => undefined;

const RoadmapMockFilters = () => (
  <RoadmapFilters
    filterText=""
    onFilterTextChange={noop}
    availableStatuses={['planned', 'in-progress', 'completed']}
    selectedStatuses={[]}
    onToggleStatus={noop}
    availableBadges={['Pilot', 'Strategisch', 'Quick Win']}
    selectedBadges={[]}
    onToggleBadge={noop}
    availableTags={['Rollout', 'Reporting', 'Service']}
    selectedTags={[]}
    onToggleTag={noop}
    availableLeads={['Lea Demo', 'Noel Demo', 'Eva Demo']}
    selectedLeads={[]}
    onToggleLead={noop}
    availablePhases={['konzept', 'realisierung', 'abschluss']}
    selectedPhases={[]}
    onTogglePhase={noop}
    selectedProjectTypes={[]}
    onToggleProjectType={noop}
    progressBucket="all"
    onProgressBucketChange={noop}
    selectedAttributes={[]}
    onToggleAttribute={noop}
    resultCount={mockProjects.length}
    totalCount={mockProjects.length}
    onClearAll={noop}
    monthRange={{ start: 1, end: 12 }}
    onMonthRangeChange={noop}
    onlyRunning={false}
    onToggleOnlyRunning={noop}
    onSelectAllCategories={noop}
    onClearCategories={noop}
  />
);

const RoadmapMockHero = () => (
  <div className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-roadmap-hero-card [border-radius:var(--ds-radius-xl)] [padding:clamp(24px,_4vw,_36px)] [&_.text-slate-300]:![color:var(--ds-text-default)] [&_.text-white]:![color:var(--ds-text-strong)]">
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
          Roadmap 2026
        </p>
        <h1
          className="text-3xl font-semibold text-white sm:text-4xl"
          style={{
            backgroundImage: 'linear-gradient(to right, #eab308, #b45309)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          IT + Digital Roadmap
        </h1>
        <p className="text-sm text-slate-300 sm:text-base">
          Filtere Projekte nach Status, Kategorien und Zeiträumen, um Fortschritt und Prioritäten
          auf einen Blick sichtbar zu machen.
        </p>
      </div>
      <div className="grid w-full gap-3 text-xs text-slate-300 sm:w-auto sm:text-sm md:grid-cols-2">
        <div className="ds-roadmap-stat-card [&_.text-white]:![color:var(--ds-text-strong)] ![border-color:var(--ds-border-default)] [background:var(--ds-bg-soft)] [color:var(--ds-text-default)] rounded-2xl border px-4 py-3 text-center">
          <span className="block text-2xl font-semibold text-white">3</span>
          <span>Projekte sichtbar</span>
        </div>
      </div>
    </div>
  </div>
);

const RoadmapMockToolbar = ({ viewMode }: { viewMode: 'timeline' | 'tiles' }) => (
  <div className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-roadmap-toolbar [border-radius:var(--ds-radius-xl)] [&_.text-slate-300]:![color:var(--ds-text-default)] [padding:clamp(16px,_3vw,_22px)] max-[760px]:[&_.flex.w-full.flex-wrap]:[width:100%]">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:gap-3">
        <div className="ds-roadmap-segmented [display:inline-flex] [align-items:center] [gap:6px] [padding:5px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:var(--ds-bg-soft)] max-[760px]:[width:100%]">
          <button
            className={`ds-roadmap-segment [display:inline-flex] [min-height:42px] [align-items:center] [justify-content:center] [border:1px_solid_transparent] [border-radius:12px] [background:transparent] [color:var(--ds-text-default)] [font-size:0.875rem] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out),_color_var(--ds-duration-base)_var(--ds-ease-out)] [padding-inline:15px] hover:[border-color:var(--ds-border-strong)] hover:[color:var(--ds-text-strong)] hover:[transform:translateY(-1px)] [&.is-active]:[border-color:var(--ds-border-strong)] [&.is-active]:[background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [&.is-active]:[box-shadow:var(--ds-shadow-glow)] [&.is-active]:[color:var(--ds-text-inverse)] max-[760px]:[flex:1_1_0] ${viewMode === 'timeline' ? 'is-active' : ''}`}
            type="button"
            title="Zeitstrahl"
          >
            Zeitstrahl
          </button>
          <button
            className={`ds-roadmap-segment [display:inline-flex] [min-height:42px] [align-items:center] [justify-content:center] [border:1px_solid_transparent] [border-radius:12px] [background:transparent] [color:var(--ds-text-default)] [font-size:0.875rem] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out),_color_var(--ds-duration-base)_var(--ds-ease-out)] [padding-inline:15px] hover:[border-color:var(--ds-border-strong)] hover:[color:var(--ds-text-strong)] hover:[transform:translateY(-1px)] [&.is-active]:[border-color:var(--ds-border-strong)] [&.is-active]:[background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [&.is-active]:[box-shadow:var(--ds-shadow-glow)] [&.is-active]:[color:var(--ds-text-inverse)] max-[760px]:[flex:1_1_0] ${viewMode === 'tiles' ? 'is-active' : ''}`}
            type="button"
            title="Kachelansicht"
          >
            Kacheln
          </button>
        </div>
        <button
          className="ds-roadmap-scale-button [display:inline-flex] [min-height:42px] [align-items:center] [justify-content:center] [border:1px_solid_transparent] [border-radius:12px] [background:transparent] [color:var(--ds-text-default)] [font-size:0.875rem] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out),_color_var(--ds-duration-base)_var(--ds-ease-out)] [padding-inline:15px] [flex:1_1_auto] [border-color:var(--ds-border-subtle)] [background:color-mix(in_srgb,_var(--ds-bg-elevated)_70%,_transparent)] hover:[border-color:var(--ds-border-strong)] hover:[color:var(--ds-text-strong)] hover:[transform:translateY(-1px)] [&.is-active]:[border-color:var(--ds-border-strong)] [&.is-active]:[background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [&.is-active]:[box-shadow:var(--ds-shadow-glow)] [&.is-active]:[color:var(--ds-text-inverse)] max-[760px]:[flex:1_1_0] is-active"
          type="button"
        >
          Quartale
        </button>
        <button
          className="ds-roadmap-scale-button [display:inline-flex] [min-height:42px] [align-items:center] [justify-content:center] [border:1px_solid_transparent] [border-radius:12px] [background:transparent] [color:var(--ds-text-default)] [font-size:0.875rem] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out),_color_var(--ds-duration-base)_var(--ds-ease-out)] [padding-inline:15px] [flex:1_1_auto] [border-color:var(--ds-border-subtle)] [background:color-mix(in_srgb,_var(--ds-bg-elevated)_70%,_transparent)] hover:[border-color:var(--ds-border-strong)] hover:[color:var(--ds-text-strong)] hover:[transform:translateY(-1px)] [&.is-active]:[border-color:var(--ds-border-strong)] [&.is-active]:[background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [&.is-active]:[box-shadow:var(--ds-shadow-glow)] [&.is-active]:[color:var(--ds-text-inverse)] max-[760px]:[flex:1_1_0]"
          type="button"
        >
          Monate
        </button>
        <button
          className="ds-roadmap-scale-button [display:inline-flex] [min-height:42px] [align-items:center] [justify-content:center] [border:1px_solid_transparent] [border-radius:12px] [background:transparent] [color:var(--ds-text-default)] [font-size:0.875rem] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out),_color_var(--ds-duration-base)_var(--ds-ease-out)] [padding-inline:15px] [flex:1_1_auto] [border-color:var(--ds-border-subtle)] [background:color-mix(in_srgb,_var(--ds-bg-elevated)_70%,_transparent)] hover:[border-color:var(--ds-border-strong)] hover:[color:var(--ds-text-strong)] hover:[transform:translateY(-1px)] [&.is-active]:[border-color:var(--ds-border-strong)] [&.is-active]:[background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [&.is-active]:[box-shadow:var(--ds-shadow-glow)] [&.is-active]:[color:var(--ds-text-inverse)] max-[760px]:[flex:1_1_0]"
          type="button"
        >
          Wochen
        </button>
        <button
          className="ds-roadmap-scale-button [display:inline-flex] [min-height:42px] [align-items:center] [justify-content:center] [border:1px_solid_transparent] [border-radius:12px] [background:transparent] [color:var(--ds-text-default)] [font-size:0.875rem] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out),_color_var(--ds-duration-base)_var(--ds-ease-out)] [padding-inline:15px] [flex:1_1_auto] [border-color:var(--ds-border-subtle)] [background:color-mix(in_srgb,_var(--ds-bg-elevated)_70%,_transparent)] hover:[border-color:var(--ds-border-strong)] hover:[color:var(--ds-text-strong)] hover:[transform:translateY(-1px)] [&.is-active]:[border-color:var(--ds-border-strong)] [&.is-active]:[background:linear-gradient(135deg,_var(--ds-accent),_var(--ds-accent-2))] [&.is-active]:[box-shadow:var(--ds-shadow-glow)] [&.is-active]:[color:var(--ds-text-inverse)] max-[760px]:[flex:1_1_0]"
          type="button"
        >
          Jahre
        </button>
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-4 md:justify-end">
        <RoadmapYearNavigation initialYear={2026} onYearChange={noop} />
      </div>
    </div>
  </div>
);

const RoadmapMockSidebar = () => (
  <CategorySidebar
    categories={mockCategories}
    activeCategories={mockCategories.map((category) => category.id)}
    onToggleCategory={noop}
  />
);

const RoadmapMockTimeGrid = () => (
  <div className="ds-roadmap-time-grid [margin-bottom:var(--ds-space-4)] [display:grid] [gap:10px] [&.is-quarters]:[grid-template-columns:repeat(4,_minmax(0,_1fr))] [&.is-months]:[grid-template-columns:repeat(12,_minmax(54px,_1fr))] [&.is-years]:[grid-template-columns:repeat(5,_minmax(0,_1fr))] [&.is-weeks]:![gap:4px] [&.is-weeks]:[overflow-x:auto] max-[760px]:[&.is-quarters]:[gap:6px] max-[760px]:[&.is-years]:[gap:6px] max-[760px]:[&.is-months]:[overflow-x:auto] is-quarters">
    {[
      ['Q1 2026', 'linear-gradient(to right, #eab308, #d97706)'],
      ['Q2 2026', 'linear-gradient(to right, #d97706, #ea580c)'],
      ['Q3 2026', 'linear-gradient(to right, #ea580c, #c2410c)'],
      ['Q4 2026', 'linear-gradient(to right, #c2410c, #b91c1c)'],
    ].map(([label, background]) => (
      <div
        key={label}
        className="roadmap-time-header p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm"
        style={{ background }}
      >
        {label}
      </div>
    ))}
  </div>
);

const RoadmapMockTimelineRows = () => (
  <div className="ds-roadmap-category-stack [display:grid] [gap:var(--ds-space-6)] relative">
    <div className="ds-roadmap-category-section [padding:clamp(14px,_2vw,_20px)] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-xl)] [background:color-mix(in_srgb,_var(--ds-bg-elevated)_68%,_transparent)] [box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.04)] [content-visibility:auto] [contain-intrinsic-block-size:auto_420px] [&.is-drop-target]:[border-color:var(--ds-border-strong)] [&.is-drop-target]:[background:var(--ds-accent-soft)] [&.is-drop-target]:[box-shadow:var(--ds-shadow-glow)] [&.is-dragged]:[opacity:0.58]">
      <div className="mb-2 flex items-center gap-3 md:mb-3">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: mockCategories[0].color }}
        />
        <h2 className="text-lg md:text-xl font-semibold m-0">Digital Workplace</h2>
        <span className="roadmap-project-count-badge ml-2 text-xs md:text-sm px-2 py-0.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-200">
          2 Projekte
        </span>
      </div>

      <div className="space-y-2 md:space-y-4">
        {[
          {
            title: 'Modern Workplace Rollout',
            left: '0%',
            width: '68%',
            color: mockCategories[0].color,
          },
          { title: 'Service Portal', left: '32%', width: '64%', color: '#37f2d0' },
        ].map((project) => (
          <div key={project.title} className="relative mb-1 h-6 md:mb-2 md:h-8">
            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
              <div className="grid grid-cols-4 gap-2 md:gap-4 h-full">
                <div className="bg-slate-800 rounded-lg opacity-30" />
                <div className="bg-slate-800 rounded-lg opacity-30" />
                <div className="bg-slate-800 rounded-lg opacity-30" />
                <div className="bg-slate-800 rounded-lg opacity-30" />
              </div>
            </div>

            <div
              className="roadmap-project-bar absolute top-0 h-full rounded-lg flex items-center px-1 md:px-3 transition-all hover:brightness-110 group border border-white border-opacity-30 hover:border-opacity-70 cursor-pointer"
              style={{
                left: project.left,
                width: project.width,
                backgroundColor: project.color,
                opacity: 0.85,
              }}
            >
              <div className="flex items-center gap-1 w-full overflow-hidden">
                <span className="roadmap-project-label font-medium truncate px-1 md:px-2 py-0.5 rounded bg-black bg-opacity-40 text-white group-hover:bg-opacity-60 text-[10px] md:text-sm flex-shrink">
                  {project.title}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RoadmapMockTiles = () => (
  <div className="ds-roadmap-category-stack [display:grid] [gap:var(--ds-space-6)]">
    <div className="ds-roadmap-category-section [padding:clamp(14px,_2vw,_20px)] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-xl)] [background:color-mix(in_srgb,_var(--ds-bg-elevated)_68%,_transparent)] [box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.04)] [content-visibility:auto] [contain-intrinsic-block-size:auto_420px] [&.is-drop-target]:[border-color:var(--ds-border-strong)] [&.is-drop-target]:[background:var(--ds-accent-soft)] [&.is-drop-target]:[box-shadow:var(--ds-shadow-glow)] [&.is-dragged]:[opacity:0.58]">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: mockCategories[0].color }}
        />
        <h2 className="text-lg md:text-xl font-semibold m-0">Digital Workplace</h2>
        <span className="roadmap-project-count-badge ml-2 text-xs md:text-sm px-2 py-0.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-200">
          3 Projekte
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {mockProjects.map((project) => {
          const category =
            mockCategories.find((entry) => entry.id === project.category) || mockCategories[0];
          return (
            <CompactProjectCard
              key={project.id}
              project={project}
              categoryName={category.name}
              categoryColor={category.color}
              onClick={noop}
            />
          );
        })}
      </div>
    </div>
  </div>
);

const steps: Step[] = [
  {
    title: 'Startseite verstehen',
    description:
      'Die Roadmap zeigt Projekte als Zeitleiste oder Kacheln. Farbige Balken stehen für Kategorien und sorgen für Orientierung.',
    details: [
      'Kategorie-Farben spiegeln Verantwortungsbereiche wider.',
      'Ein Verlauf weist auf priorisierte Initiativen hin.',
    ],
    icon: FiEye,
  },
  {
    title: 'Filtern und suchen',
    description:
      'Über der Roadmap finden Sie Textsuche, Status-Filter sowie die Auswahl von Kategorien oder Monaten.',
    details: [
      'Nutzen Sie die Suche für Projektnamen, Stichworte oder Verantwortliche.',
      'Aktivieren Sie "Nur laufende Projekte", um aktuell aktive Initiativen einzublenden.',
    ],
    icon: FiSearch,
  },
  {
    title: 'Details anzeigen',
    description:
      'Ein Klick auf ein Projekt öffnet ein Panel mit Beschreibung, Meilensteinen, Ansprechpersonen und Links.',
    details: [
      'Das Panel lässt sich mit der Escape-Taste oder dem Schließen-Button beenden.',
      'Links führen direkt zu SharePoint-Dokumenten oder zusätzlichen Ressourcen.',
    ],
    icon: FiMousePointer,
  },
  {
    title: 'Ansicht wechseln',
    description:
      'Über die Buttons "Zeitstrahl" und "Kacheln" entscheiden Sie, ob die Jahresplanung oder verdichtete Karten angezeigt werden.',
    details: [
      'Zeitstrahl: ideal für Langfristplanung und Abhängigkeiten.',
      'Kacheln: kompakter Überblick, perfekt für Sitzungen oder mobile Geräte.',
    ],
    icon: FiGrid,
  },
];

const ErsteSchritte = () => {
  return (
    <>
      <Head>
        <title>Erste Schritte | JSDoIT Roadmap</title>
      </Head>
      <div className="ds-page-shell before:[position:absolute] before:[inset:0] before:[z-index:0] before:[pointer-events:none] before:[background-image:linear-gradient(var(--ds-grid-line)_1px,_transparent_1px),_linear-gradient(90deg,_var(--ds-grid-line)_1px,_transparent_1px)] before:[background-size:56px_56px] before:[mask-image:linear-gradient(to_bottom,_black,_rgba(0,_0,_0,_0.72),_transparent_98%)] after:[position:absolute] after:[right:-10%] after:[bottom:-25%] after:[left:-10%] after:[z-index:0] after:[height:38vh] after:[pointer-events:none] after:[background:radial-gradient(ellipse_at_center,_var(--ds-hero-glow-a),_transparent_62%)] after:[filter:blur(12px)] [position:relative] [isolation:isolate] [display:flex] [min-height:100vh] [flex-direction:column] [overflow:hidden] [background:radial-gradient(circle_at_7%_18%,_var(--ds-hero-glow-a),_transparent_31%),_radial-gradient(circle_at_70%_8%,_var(--ds-hero-glow-b),_transparent_28%),_radial-gradient(circle_at_48%_86%,_var(--ds-hero-glow-c),_transparent_26%),_linear-gradient(135deg,_var(--ds-bg-page),_var(--ds-bg-page-2))] [color:var(--ds-text-default)] [font-family:var(--ds-font-sans)] [&>*]:[position:relative] [&>*]:[z-index:1]">
        <SiteHeader activeRoute="help" />

        <main className="ds-page-main [flex:1]">
          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-hero [display:grid] [min-height:calc(100vh_-_78px)] [grid-template-columns:minmax(0,_1.08fr)_minmax(420px,_0.92fr)] [align-items:center] [gap:clamp(40px,_6vw,_86px)] [padding-block:clamp(56px,_7vw,_96px)] max-[1100px]:[grid-template-columns:1fr] max-[760px]:[padding-block:42px] ds-help-hero [min-height:auto] [padding-block:clamp(48px,_7vw,_88px)]">
            <div className="ds-hero-content [max-width:760px]">
              <div className="ds-badge-row [display:flex] [flex-wrap:wrap] [gap:10px]">
                <Link
                  className="ds-badge [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [padding:7px_10px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-bg-soft)] [color:var(--ds-text-default)] [font-size:0.75rem] [font-weight:750]"
                  href="/help"
                >
                  Hilfe
                </Link>
                <span className="ds-badge [display:inline-flex] [align-items:center] [gap:var(--ds-space-2)] [padding:7px_10px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-bg-soft)] [color:var(--ds-text-default)] [font-size:0.75rem] [font-weight:750] ds-badge-success [background:color-mix(in_srgb,_var(--ds-success)_13%,_transparent)] [color:var(--ds-success)]">
                  Erste Schritte
                </span>
              </div>

              <div className="ds-eyebrow [display:inline-flex] [width:fit-content] [align-items:center] [gap:10px] [padding:9px_15px] [border:1px_solid_var(--ds-border-strong)] [border-radius:var(--ds-radius-pill)] [background:var(--ds-accent-soft)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-strong)] [font-size:0.75rem] [font-weight:850] [letter-spacing:0.22em] [text-transform:uppercase] [&_svg]:[color:var(--ds-accent-strong)]">
                <FiCompass className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                Schnellstart
              </div>
              <h1 className="ds-hero-title [max-width:760px] [margin:28px_0_22px] [color:var(--ds-text-strong)] [font-size:clamp(2.625rem,_5.8vw,_4.75rem)] [font-weight:860] [letter-spacing:-0.06em] [line-height:0.98] [text-wrap:balance]">
                Erste Schritte mit der Roadmap.
              </h1>
              <p className="ds-hero-copy [max-width:660px] [margin:0] [color:var(--ds-text-default)] [font-size:1.0625rem] [line-height:1.75]">
                Diese Einführung führt Sie in weniger als fünf Minuten durch die wichtigsten
                Funktionen. Folgen Sie den vier Schritten und testen Sie die Roadmap parallel in
                einem zweiten Tab.
              </p>

              <div className="ds-actions [display:flex] [flex-wrap:wrap] [align-items:center] [gap:var(--ds-space-4)] [margin-top:30px] max-[760px]:[&_.ds-button]:[width:100%]">
                <Link
                  className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-primary [background:linear-gradient(_135deg,_var(--ds-accent),_var(--ds-accent-2)_58%,_var(--ds-accent-strong)_)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-text-inverse)]"
                  href="/roadmap"
                >
                  Roadmap öffnen
                  <FiArrowRight className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                </Link>
                <Link
                  className="ds-button [display:inline-flex] [min-height:54px] [align-items:center] [justify-content:center] [gap:10px] [padding-inline:22px] [border:1px_solid_transparent] [border-radius:16px] [font-weight:800] [transition:transform_var(--ds-duration-fast)_var(--ds-ease-out),_box-shadow_var(--ds-duration-base)_var(--ds-ease-out),_border-color_var(--ds-duration-base)_var(--ds-ease-out),_background_var(--ds-duration-base)_var(--ds-ease-out)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] disabled:[cursor:not-allowed] disabled:[opacity:0.6] disabled:[transform:none] ds-button-secondary [border-color:var(--ds-border-default)] [background:var(--ds-bg-elevated)] [box-shadow:var(--ds-shadow-card)] [color:var(--ds-text-strong)]"
                  href="/help/faq"
                >
                  FAQ öffnen
                </Link>
              </div>
            </div>

            <aside
              className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-logic-panel [padding:30px] [border-color:var(--ds-border-strong)] [border-radius:var(--ds-radius-xl)] [box-shadow:var(--ds-shadow-soft),_var(--ds-shadow-glow),_inset_0_1px_0_rgba(255,_255,_255,_0.06)] max-[1100px]:[max-width:760px]"
              aria-label="Was Sie lernen"
            >
              <div className="ds-panel-header [display:flex] [justify-content:space-between] [gap:var(--ds-space-5)] [margin-bottom:24px] max-[760px]:[flex-direction:column-reverse]">
                <div>
                  <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                    Was Sie lernen
                  </p>
                  <h2 className="ds-panel-title [margin:0] [color:var(--ds-text-strong)] [font-size:clamp(1.5rem,_3vw,_2.125rem)] [letter-spacing:-0.04em] [line-height:1.15]">
                    Ein schneller Überblick für den Alltag
                  </h2>
                </div>
                <div
                  className="ds-panel-icon [display:grid] [flex:0_0_auto] [width:68px] [height:68px] [place-items:center] [border:1px_solid_var(--ds-border-strong)] [border-radius:24px] [background:radial-gradient(circle,_var(--ds-accent-soft),_transparent_74%)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-accent-strong)]"
                  aria-hidden="true"
                >
                  <FiBookOpen className="ds-icon-md [flex:0_0_auto] [width:1.5rem] [height:1.5rem]" />
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
          </section>

          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px] ds-help-knowledge-section [padding-top:0]">
            <div className="ds-section-header [display:flex] [align-items:end] [justify-content:space-between] [gap:var(--ds-space-6)] [margin-bottom:24px]">
              <div>
                <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                  Screenshots & Markierungen
                </p>
                <h2 className="ds-section-title [margin:0] [color:var(--ds-text-strong)] [font-size:2rem] [letter-spacing:-0.04em]">
                  Die Oberfläche auf einen Blick
                </h2>
              </div>
              <p className="ds-section-copy [max-width:620px] [margin:10px_0_0] [color:var(--ds-text-muted)] [line-height:1.65]">
                Die folgenden Ausschnitte zeigen, wo Sie sich orientieren, filtern und zwischen
                Ansichten wechseln. Die Nummern finden Sie direkt neben den Erklärungen wieder.
              </p>
            </div>

            <div className="ds-screenshot-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:var(--ds-space-6)] max-[1100px]:[grid-template-columns:1fr]">
              <article className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-screenshot-card [display:grid] [gap:var(--ds-space-4)] [padding:24px] [border-radius:var(--ds-radius-xl)] ds-roadmap-screenshot-card [grid-column:1_/_-1]">
                <div
                  className="ds-screenshot-frame [position:relative] [display:grid] [min-height:360px] [gap:var(--ds-space-4)] [padding:20px] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-lg)] [background:linear-gradient(_90deg,_color-mix(in_srgb,_var(--ds-border-default)_28%,_transparent)_1px,_transparent_1px_),_linear-gradient(_0deg,_color-mix(in_srgb,_var(--ds-border-default)_22%,_transparent)_1px,_transparent_1px_),_linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [background-size:48px_48px,_48px_48px,_auto] ds-roadmap-screenshot-frame [display:block] [min-height:0] [padding:clamp(14px,_2vw,_22px)] [overflow:auto] [background:linear-gradient(180deg,_var(--ds-bg-page),_var(--ds-bg-elevated))]"
                  aria-label="Annotierter Screenshot der Roadmap-Übersicht"
                >
                  <div className="ds-roadmap-mockup [min-width:960px] [&_.ds-roadmap-toolbar>div]:[flex-direction:row] [&_.ds-roadmap-toolbar>div]:[align-items:center] [&_.ds-roadmap-toolbar>div]:[justify-content:space-between] [&_.ds-roadmap-toolbar_.flex.w-full.flex-wrap]:[width:auto] [&_.ds-roadmap-segmented]:[width:auto] [&_.ds-roadmap-year-nav]:[width:auto] [&_.ds-roadmap-segment]:[flex:0_0_auto] [&_.ds-roadmap-scale-button]:[flex:0_0_auto] [&_.ds-roadmap-sidebar]:[position:static] [&_.ds-roadmap-sidebar]:[inset:auto] [&_.ds-roadmap-sidebar]:[z-index:auto] [&_.ds-roadmap-sidebar]:[display:block] [&_.ds-roadmap-sidebar]:[flex:0_0_260px] [&_.ds-roadmap-sidebar]:[padding:0] [&_.ds-roadmap-sidebar]:[border:0] [&_.ds-roadmap-sidebar]:[border-radius:0] [&_.ds-roadmap-sidebar]:[background:transparent] [&_.ds-roadmap-sidebar]:[box-shadow:none] [&_.ds-roadmap-sidebar]:[backdrop-filter:none] ds-roadmap-shell [display:grid] [gap:var(--ds-space-8)] [&_.roadmap-project-count-badge]:[display:inline-flex] [&_.roadmap-project-count-badge]:[align-items:center] [&_.roadmap-project-count-badge]:[gap:7px] [&_.roadmap-project-count-badge]:![border:1px_solid_var(--ds-border-default)] [&_.roadmap-project-count-badge]:![border-radius:var(--ds-radius-pill)] [&_.roadmap-project-count-badge]:![background:var(--ds-bg-soft)] [&_.roadmap-project-count-badge]:![color:var(--ds-text-strong)] [&_.roadmap-project-count-badge]:[font-weight:800] [&_.roadmap-filter-summary-badge]:[display:inline-flex] [&_.roadmap-filter-summary-badge]:[align-items:center] [&_.roadmap-filter-summary-badge]:[gap:7px] [&_.roadmap-filter-summary-badge]:![border:1px_solid_var(--ds-border-default)] [&_.roadmap-filter-summary-badge]:![border-radius:var(--ds-radius-pill)] [&_.roadmap-filter-summary-badge]:![background:var(--ds-bg-soft)] [&_.roadmap-filter-summary-badge]:![color:var(--ds-text-strong)] [&_.roadmap-filter-summary-badge]:[font-weight:800] [&_.roadmap-filter-secondary-button]:[display:inline-flex] [&_.roadmap-filter-secondary-button]:[align-items:center] [&_.roadmap-filter-secondary-button]:[gap:7px] [&_.roadmap-filter-secondary-button]:![border:1px_solid_var(--ds-border-default)] [&_.roadmap-filter-secondary-button]:![border-radius:var(--ds-radius-pill)] [&_.roadmap-filter-secondary-button]:![background:var(--ds-bg-soft)] [&_.roadmap-filter-secondary-button]:![color:var(--ds-text-strong)] [&_.roadmap-filter-secondary-button]:[font-weight:800] [&_.roadmap-time-header]:![border:1px_solid_var(--ds-border-default)] [&_.roadmap-time-header]:![border-radius:12px] [&_.roadmap-time-header]:![background:linear-gradient(_135deg,_color-mix(in_srgb,_var(--ds-accent)_30%,_var(--ds-bg-elevated-strong)),_color-mix(in_srgb,_var(--ds-accent-2)_22%,_var(--ds-bg-elevated))_)] [&_.roadmap-time-header]:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.08)] [&_.roadmap-time-header]:![color:var(--ds-text-strong)] [&_.compact-project-card]:[content-visibility:auto] [&_.compact-project-card]:[contain-intrinsic-block-size:auto_190px] [&_.bg-slate-800.opacity-30]:![background:var(--ds-bg-soft)] [&_.bg-slate-800.opacity-30]:![opacity:1] [&_.roadmap-project-bar]:![border-color:rgba(255,_255,_255,_0.42)] [&_.roadmap-project-bar]:[box-shadow:0_10px_28px_color-mix(in_srgb,_var(--ds-bg-page)_52%,_transparent)] [&_.roadmap-project-bar]:![opacity:0.92] [&_.roadmap-project-label]:![background:rgba(0,_0,_0,_0.34)] [&_.roadmap-project-label]:![color:#ffffff] [&_.roadmap-filters-shell]:![border-color:var(--ds-border-default)] [&_.roadmap-filters-shell]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filters-shell]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-panel]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-panel]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filter-panel]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-subpanel]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-subpanel]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filter-subpanel]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-footer]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-footer]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filter-footer]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-stat]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-stat]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filter-stat]:![box-shadow:var(--ds-shadow-card)] [&_.compact-project-card]:![border-color:var(--ds-border-default)] [&_.compact-project-card]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.compact-project-card]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-chip]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-chip]:![background:var(--ds-bg-soft)] [&_.roadmap-filter-chip]:![color:var(--ds-text-default)] [&_.roadmap-filter-chip:hover]:![border-color:var(--ds-border-strong)] [&_.roadmap-filter-chip:hover]:![background:var(--ds-bg-muted)] [&_.roadmap-filter-chip:hover]:![color:var(--ds-text-strong)] [&_.roadmap-filter-chip-active]:![border-color:var(--ds-border-strong)] [&_.roadmap-filter-chip-active]:![background:var(--ds-accent-soft)] [&_.roadmap-filter-chip-active]:![color:var(--ds-accent-strong)] [&_.roadmap-filter-input]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-input]:![background:var(--ds-bg-elevated-strong)] [&_.roadmap-filter-input]:![color:var(--ds-text-strong)] [&_:is(.text-white,_.text-slate-100)]:![color:var(--ds-text-strong)] [&_:is(.text-slate-200,_.text-slate-300,_.text-gray-200,_.text-gray-300)]:![color:var(--ds-text-default)] [&_:is(.text-slate-400,_.text-slate-500,_.text-gray-400)]:![color:var(--ds-text-muted)] [&_.compact-project-card]:[min-height:100%] [&_.compact-project-card]:![border-radius:var(--ds-radius-md)] [&_.compact-project-card:hover]:![border-color:var(--ds-border-strong)] [&_.compact-project-card:hover]:![box-shadow:var(--ds-shadow-card),_var(--ds-shadow-glow)] [&_.compact-project-card_h3]:![color:var(--ds-text-strong)] [&_.compact-project-card_p]:![color:var(--ds-text-default)] [&_.compact-project-card_.text-slate-300]:![color:var(--ds-text-default)] max-[760px]:[gap:var(--ds-space-5)]">
                    <RoadmapMockHero />
                    <RoadmapMockToolbar viewMode="timeline" />
                    <div className="ds-roadmap-layout [display:flex] [gap:var(--ds-space-6)] [align-items:flex-start] max-[1100px]:[flex-direction:column] relative">
                      <div className="ds-roadmap-sidebar [flex:0_0_260px] max-[1100px]:[width:100%] max-[1100px]:[flex-basis:auto] max-[760px]:[position:absolute] max-[760px]:[inset:0_0_auto] max-[760px]:[z-index:5] max-[760px]:[display:none] max-[760px]:[padding:var(--ds-space-4)] max-[760px]:[border:1px_solid_var(--ds-border-default)] max-[760px]:[border-radius:var(--ds-radius-xl)] max-[760px]:[background:color-mix(in_srgb,_var(--ds-bg-page)_92%,_transparent)] max-[760px]:[box-shadow:var(--ds-shadow-card)] max-[760px]:[backdrop-filter:blur(18px)] max-[760px]:[&.is-open]:[display:block]">
                        <RoadmapMockSidebar />
                      </div>
                      <div className="ds-roadmap-content [min-width:0] [flex:1_1_auto] [overflow:hidden]">
                        <div
                          className="ds-roadmap-scroll [overflow-x:auto] [padding-bottom:var(--ds-space-4)]"
                          style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                          <div className="ds-roadmap-canvas [min-width:100%] max-[1100px]:[&.is-wide]:[min-width:800px]">
                            <div className="ds-roadmap-filter-slot [margin-bottom:var(--ds-space-4)]">
                              <RoadmapMockFilters />
                            </div>
                            <RoadmapMockTimeGrid />
                            <RoadmapMockTimelineRows />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span
                    className="ds-screenshot-marker [position:absolute] [display:grid] [width:34px] [height:34px] [place-items:center] [border:2px_solid_var(--ds-text-inverse)] [border-radius:50%] [background:var(--ds-accent-strong)] [box-shadow:0_0_0_8px_var(--ds-accent-soft),_var(--ds-shadow-glow)] [color:var(--ds-text-inverse)] [font-size:0.875rem] [font-weight:900]"
                    style={{ left: '7%', top: '13%' }}
                  >
                    1
                  </span>
                  <span
                    className="ds-screenshot-marker [position:absolute] [display:grid] [width:34px] [height:34px] [place-items:center] [border:2px_solid_var(--ds-text-inverse)] [border-radius:50%] [background:var(--ds-accent-strong)] [box-shadow:0_0_0_8px_var(--ds-accent-soft),_var(--ds-shadow-glow)] [color:var(--ds-text-inverse)] [font-size:0.875rem] [font-weight:900]"
                    style={{ left: '55%', top: '30%' }}
                  >
                    2
                  </span>
                  <span
                    className="ds-screenshot-marker [position:absolute] [display:grid] [width:34px] [height:34px] [place-items:center] [border:2px_solid_var(--ds-text-inverse)] [border-radius:50%] [background:var(--ds-accent-strong)] [box-shadow:0_0_0_8px_var(--ds-accent-soft),_var(--ds-shadow-glow)] [color:var(--ds-text-inverse)] [font-size:0.875rem] [font-weight:900]"
                    style={{ left: '72%', top: '72%' }}
                  >
                    3
                  </span>
                </div>
                <div className="ds-screenshot-notes [display:grid] [gap:var(--ds-space-3)]">
                  {screenshotMarkers.overview.map((marker) => (
                    <div
                      key={marker.number}
                      className="ds-screenshot-note [display:grid] [grid-template-columns:34px_minmax(0,_1fr)] [gap:var(--ds-space-3)] [padding:14px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:var(--ds-bg-soft)] [&>span]:[display:grid] [&>span]:[width:28px] [&>span]:[height:28px] [&>span]:[place-items:center] [&>span]:[border-radius:50%] [&>span]:[background:var(--ds-accent-soft)] [&>span]:[color:var(--ds-accent-strong)] [&>span]:[font-size:0.75rem] [&>span]:[font-weight:900] [&_h3]:[margin:0] [&_h3]:[color:var(--ds-text-strong)] [&_h3]:[font-size:0.875rem] [&_h3]:[font-weight:850] [&_p]:[margin:5px_0_0] [&_p]:[color:var(--ds-text-muted)] [&_p]:[font-size:0.8125rem] [&_p]:[line-height:1.5]"
                    >
                      <span>{marker.number}</span>
                      <div>
                        <h3>{marker.title}</h3>
                        <p>{marker.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-screenshot-card [display:grid] [gap:var(--ds-space-4)] [padding:24px] [border-radius:var(--ds-radius-xl)] ds-roadmap-screenshot-card [grid-column:1_/_-1]">
                <div
                  className="ds-screenshot-frame [position:relative] [display:grid] [min-height:360px] [gap:var(--ds-space-4)] [padding:20px] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-lg)] [background:linear-gradient(_90deg,_color-mix(in_srgb,_var(--ds-border-default)_28%,_transparent)_1px,_transparent_1px_),_linear-gradient(_0deg,_color-mix(in_srgb,_var(--ds-border-default)_22%,_transparent)_1px,_transparent_1px_),_linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [background-size:48px_48px,_48px_48px,_auto] ds-roadmap-screenshot-frame [display:block] [min-height:0] [padding:clamp(14px,_2vw,_22px)] [overflow:auto] [background:linear-gradient(180deg,_var(--ds-bg-page),_var(--ds-bg-elevated))]"
                  aria-label="Annotierter Screenshot der Filter und Ansichten"
                >
                  <div className="ds-roadmap-mockup [min-width:960px] [&_.ds-roadmap-toolbar>div]:[flex-direction:row] [&_.ds-roadmap-toolbar>div]:[align-items:center] [&_.ds-roadmap-toolbar>div]:[justify-content:space-between] [&_.ds-roadmap-toolbar_.flex.w-full.flex-wrap]:[width:auto] [&_.ds-roadmap-segmented]:[width:auto] [&_.ds-roadmap-year-nav]:[width:auto] [&_.ds-roadmap-segment]:[flex:0_0_auto] [&_.ds-roadmap-scale-button]:[flex:0_0_auto] [&_.ds-roadmap-sidebar]:[position:static] [&_.ds-roadmap-sidebar]:[inset:auto] [&_.ds-roadmap-sidebar]:[z-index:auto] [&_.ds-roadmap-sidebar]:[display:block] [&_.ds-roadmap-sidebar]:[flex:0_0_260px] [&_.ds-roadmap-sidebar]:[padding:0] [&_.ds-roadmap-sidebar]:[border:0] [&_.ds-roadmap-sidebar]:[border-radius:0] [&_.ds-roadmap-sidebar]:[background:transparent] [&_.ds-roadmap-sidebar]:[box-shadow:none] [&_.ds-roadmap-sidebar]:[backdrop-filter:none] ds-roadmap-shell [display:grid] [gap:var(--ds-space-8)] [&_.roadmap-project-count-badge]:[display:inline-flex] [&_.roadmap-project-count-badge]:[align-items:center] [&_.roadmap-project-count-badge]:[gap:7px] [&_.roadmap-project-count-badge]:![border:1px_solid_var(--ds-border-default)] [&_.roadmap-project-count-badge]:![border-radius:var(--ds-radius-pill)] [&_.roadmap-project-count-badge]:![background:var(--ds-bg-soft)] [&_.roadmap-project-count-badge]:![color:var(--ds-text-strong)] [&_.roadmap-project-count-badge]:[font-weight:800] [&_.roadmap-filter-summary-badge]:[display:inline-flex] [&_.roadmap-filter-summary-badge]:[align-items:center] [&_.roadmap-filter-summary-badge]:[gap:7px] [&_.roadmap-filter-summary-badge]:![border:1px_solid_var(--ds-border-default)] [&_.roadmap-filter-summary-badge]:![border-radius:var(--ds-radius-pill)] [&_.roadmap-filter-summary-badge]:![background:var(--ds-bg-soft)] [&_.roadmap-filter-summary-badge]:![color:var(--ds-text-strong)] [&_.roadmap-filter-summary-badge]:[font-weight:800] [&_.roadmap-filter-secondary-button]:[display:inline-flex] [&_.roadmap-filter-secondary-button]:[align-items:center] [&_.roadmap-filter-secondary-button]:[gap:7px] [&_.roadmap-filter-secondary-button]:![border:1px_solid_var(--ds-border-default)] [&_.roadmap-filter-secondary-button]:![border-radius:var(--ds-radius-pill)] [&_.roadmap-filter-secondary-button]:![background:var(--ds-bg-soft)] [&_.roadmap-filter-secondary-button]:![color:var(--ds-text-strong)] [&_.roadmap-filter-secondary-button]:[font-weight:800] [&_.roadmap-time-header]:![border:1px_solid_var(--ds-border-default)] [&_.roadmap-time-header]:![border-radius:12px] [&_.roadmap-time-header]:![background:linear-gradient(_135deg,_color-mix(in_srgb,_var(--ds-accent)_30%,_var(--ds-bg-elevated-strong)),_color-mix(in_srgb,_var(--ds-accent-2)_22%,_var(--ds-bg-elevated))_)] [&_.roadmap-time-header]:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.08)] [&_.roadmap-time-header]:![color:var(--ds-text-strong)] [&_.compact-project-card]:[content-visibility:auto] [&_.compact-project-card]:[contain-intrinsic-block-size:auto_190px] [&_.bg-slate-800.opacity-30]:![background:var(--ds-bg-soft)] [&_.bg-slate-800.opacity-30]:![opacity:1] [&_.roadmap-project-bar]:![border-color:rgba(255,_255,_255,_0.42)] [&_.roadmap-project-bar]:[box-shadow:0_10px_28px_color-mix(in_srgb,_var(--ds-bg-page)_52%,_transparent)] [&_.roadmap-project-bar]:![opacity:0.92] [&_.roadmap-project-label]:![background:rgba(0,_0,_0,_0.34)] [&_.roadmap-project-label]:![color:#ffffff] [&_.roadmap-filters-shell]:![border-color:var(--ds-border-default)] [&_.roadmap-filters-shell]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filters-shell]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-panel]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-panel]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filter-panel]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-subpanel]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-subpanel]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filter-subpanel]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-footer]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-footer]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filter-footer]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-stat]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-stat]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.roadmap-filter-stat]:![box-shadow:var(--ds-shadow-card)] [&_.compact-project-card]:![border-color:var(--ds-border-default)] [&_.compact-project-card]:![background:linear-gradient(_180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated)_)] [&_.compact-project-card]:![box-shadow:var(--ds-shadow-card)] [&_.roadmap-filter-chip]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-chip]:![background:var(--ds-bg-soft)] [&_.roadmap-filter-chip]:![color:var(--ds-text-default)] [&_.roadmap-filter-chip:hover]:![border-color:var(--ds-border-strong)] [&_.roadmap-filter-chip:hover]:![background:var(--ds-bg-muted)] [&_.roadmap-filter-chip:hover]:![color:var(--ds-text-strong)] [&_.roadmap-filter-chip-active]:![border-color:var(--ds-border-strong)] [&_.roadmap-filter-chip-active]:![background:var(--ds-accent-soft)] [&_.roadmap-filter-chip-active]:![color:var(--ds-accent-strong)] [&_.roadmap-filter-input]:![border-color:var(--ds-border-default)] [&_.roadmap-filter-input]:![background:var(--ds-bg-elevated-strong)] [&_.roadmap-filter-input]:![color:var(--ds-text-strong)] [&_:is(.text-white,_.text-slate-100)]:![color:var(--ds-text-strong)] [&_:is(.text-slate-200,_.text-slate-300,_.text-gray-200,_.text-gray-300)]:![color:var(--ds-text-default)] [&_:is(.text-slate-400,_.text-slate-500,_.text-gray-400)]:![color:var(--ds-text-muted)] [&_.compact-project-card]:[min-height:100%] [&_.compact-project-card]:![border-radius:var(--ds-radius-md)] [&_.compact-project-card:hover]:![border-color:var(--ds-border-strong)] [&_.compact-project-card:hover]:![box-shadow:var(--ds-shadow-card),_var(--ds-shadow-glow)] [&_.compact-project-card_h3]:![color:var(--ds-text-strong)] [&_.compact-project-card_p]:![color:var(--ds-text-default)] [&_.compact-project-card_.text-slate-300]:![color:var(--ds-text-default)] max-[760px]:[gap:var(--ds-space-5)]">
                    <RoadmapMockToolbar viewMode="tiles" />
                    <div className="ds-roadmap-layout [display:flex] [gap:var(--ds-space-6)] [align-items:flex-start] max-[1100px]:[flex-direction:column] relative">
                      <div className="ds-roadmap-sidebar [flex:0_0_260px] max-[1100px]:[width:100%] max-[1100px]:[flex-basis:auto] max-[760px]:[position:absolute] max-[760px]:[inset:0_0_auto] max-[760px]:[z-index:5] max-[760px]:[display:none] max-[760px]:[padding:var(--ds-space-4)] max-[760px]:[border:1px_solid_var(--ds-border-default)] max-[760px]:[border-radius:var(--ds-radius-xl)] max-[760px]:[background:color-mix(in_srgb,_var(--ds-bg-page)_92%,_transparent)] max-[760px]:[box-shadow:var(--ds-shadow-card)] max-[760px]:[backdrop-filter:blur(18px)] max-[760px]:[&.is-open]:[display:block]">
                        <RoadmapMockSidebar />
                      </div>
                      <div className="ds-roadmap-content [min-width:0] [flex:1_1_auto] [overflow:hidden]">
                        <div
                          className="ds-roadmap-scroll [overflow-x:auto] [padding-bottom:var(--ds-space-4)]"
                          style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                          <div className="ds-roadmap-canvas [min-width:100%] max-[1100px]:[&.is-wide]:[min-width:800px]">
                            <div className="ds-roadmap-filter-slot [margin-bottom:var(--ds-space-4)]">
                              <RoadmapMockFilters />
                            </div>
                            <div className="mb-6" />
                            <RoadmapMockTiles />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span
                    className="ds-screenshot-marker [position:absolute] [display:grid] [width:34px] [height:34px] [place-items:center] [border:2px_solid_var(--ds-text-inverse)] [border-radius:50%] [background:var(--ds-accent-strong)] [box-shadow:0_0_0_8px_var(--ds-accent-soft),_var(--ds-shadow-glow)] [color:var(--ds-text-inverse)] [font-size:0.875rem] [font-weight:900]"
                    style={{ left: '43%', top: '36%' }}
                  >
                    1
                  </span>
                  <span
                    className="ds-screenshot-marker [position:absolute] [display:grid] [width:34px] [height:34px] [place-items:center] [border:2px_solid_var(--ds-text-inverse)] [border-radius:50%] [background:var(--ds-accent-strong)] [box-shadow:0_0_0_8px_var(--ds-accent-soft),_var(--ds-shadow-glow)] [color:var(--ds-text-inverse)] [font-size:0.875rem] [font-weight:900]"
                    style={{ left: '9%', top: '43%' }}
                  >
                    2
                  </span>
                  <span
                    className="ds-screenshot-marker [position:absolute] [display:grid] [width:34px] [height:34px] [place-items:center] [border:2px_solid_var(--ds-text-inverse)] [border-radius:50%] [background:var(--ds-accent-strong)] [box-shadow:0_0_0_8px_var(--ds-accent-soft),_var(--ds-shadow-glow)] [color:var(--ds-text-inverse)] [font-size:0.875rem] [font-weight:900]"
                    style={{ left: '74%', top: '69%' }}
                  >
                    3
                  </span>
                </div>
                <div className="ds-screenshot-notes [display:grid] [gap:var(--ds-space-3)]">
                  {screenshotMarkers.filters.map((marker) => (
                    <div
                      key={marker.number}
                      className="ds-screenshot-note [display:grid] [grid-template-columns:34px_minmax(0,_1fr)] [gap:var(--ds-space-3)] [padding:14px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:var(--ds-bg-soft)] [&>span]:[display:grid] [&>span]:[width:28px] [&>span]:[height:28px] [&>span]:[place-items:center] [&>span]:[border-radius:50%] [&>span]:[background:var(--ds-accent-soft)] [&>span]:[color:var(--ds-accent-strong)] [&>span]:[font-size:0.75rem] [&>span]:[font-weight:900] [&_h3]:[margin:0] [&_h3]:[color:var(--ds-text-strong)] [&_h3]:[font-size:0.875rem] [&_h3]:[font-weight:850] [&_p]:[margin:5px_0_0] [&_p]:[color:var(--ds-text-muted)] [&_p]:[font-size:0.8125rem] [&_p]:[line-height:1.5]"
                    >
                      <span>{marker.number}</span>
                      <div>
                        <h3>{marker.title}</h3>
                        <p>{marker.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px]">
            <div className="ds-section-header [display:flex] [align-items:end] [justify-content:space-between] [gap:var(--ds-space-6)] [margin-bottom:24px]">
              <div>
                <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                  Schritt für Schritt
                </p>
                <h2 className="ds-section-title [margin:0] [color:var(--ds-text-strong)] [font-size:2rem] [letter-spacing:-0.04em]">
                  Vom Überblick zur passenden Ansicht
                </h2>
              </div>
              <p className="ds-section-copy [max-width:620px] [margin:10px_0_0] [color:var(--ds-text-muted)] [line-height:1.65]">
                Jeder Schritt fokussiert eine konkrete Aktion in der Roadmap: erst orientieren, dann
                suchen, Details prüfen und die beste Darstellung wählen.
              </p>
            </div>

            <div className="ds-steps [display:grid] [gap:14px]">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="ds-step [display:grid] [grid-template-columns:64px_1fr] [align-items:start] [gap:var(--ds-space-4)] [padding:20px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_80%,_transparent)] max-[760px]:[grid-template-columns:1fr]"
                >
                  <span className="ds-step-number [display:grid] [width:48px] [height:48px] [place-items:center] [border:1px_solid_var(--ds-border-strong)] [border-radius:50%] [background:var(--ds-accent-soft)] [box-shadow:var(--ds-shadow-glow)] [color:var(--ds-accent-strong)] [font-size:1rem] [font-weight:900]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="ds-help-card-header [display:flex] [align-items:center] [justify-content:space-between] [gap:var(--ds-space-3)] [margin-bottom:24px]">
                      <div>
                        <h3 className="ds-step-title [margin:0_0_8px] [color:var(--ds-text-strong)] [font-size:1rem] [font-weight:850]">
                          {step.title}
                        </h3>
                        <p className="ds-step-copy [margin:0] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.55]">
                          {step.description}
                        </p>
                      </div>
                      <div
                        className="ds-help-card-icon [display:grid] [width:44px] [height:44px] [place-items:center] [border:1px_solid_var(--ds-border-default)] [border-radius:15px] [background:var(--ds-accent-soft)] [color:var(--ds-accent-strong)]"
                        aria-hidden="true"
                      >
                        <step.icon className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                      </div>
                    </div>
                    <div className="ds-info-list [display:grid] [gap:var(--ds-space-3)]">
                      {step.details.map((detail) => (
                        <p
                          key={detail}
                          className="ds-info-item [margin:0] [padding:16px] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:color-mix(in_srgb,_var(--ds-bg-elevated-strong)_72%,_transparent)] [color:var(--ds-text-default)] [font-size:0.875rem] [line-height:1.6]"
                        >
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ds-container [width:min(1280px,_calc(100%_-_48px))] [margin-inline:auto] max-[760px]:[width:min(100%_-_32px,_1280px)] ds-section [padding-block:70px_96px] ds-help-knowledge-section [padding-top:0]">
            <div className="ds-card [position:relative] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-md)] [background:linear-gradient(180deg,_var(--ds-bg-elevated-strong),_var(--ds-bg-elevated))] [box-shadow:var(--ds-shadow-card)] before:[position:absolute] before:[inset:0] before:[pointer-events:none] before:[background:radial-gradient(circle_at_12%_0%,_var(--ds-accent-soft),_transparent_35%)] [&>*]:[position:relative] ds-help-support-panel [display:flex] [align-items:center] [justify-content:space-between] [gap:var(--ds-space-6)] [padding:32px] [border-radius:var(--ds-radius-xl)] max-[1100px]:[align-items:flex-start] max-[1100px]:[flex-direction:column]">
              <div>
                <p className="ds-panel-label [margin:0_0_12px] [color:var(--ds-accent-strong)] [font-size:0.75rem] [font-weight:900] [letter-spacing:0.23em] [text-transform:uppercase]">
                  Nächste Schritte
                </p>
                <h2 className="ds-section-title [margin:0] [color:var(--ds-text-strong)] [font-size:2rem] [letter-spacing:-0.04em]">
                  Jetzt gezielt vertiefen
                </h2>
                <p className="ds-section-copy [max-width:620px] [margin:10px_0_0] [color:var(--ds-text-muted)] [line-height:1.65]">
                  Die Grundlagen sitzen? Dann empfehlen wir, die Filter tiefer kennenzulernen oder
                  eigene Projekte zu melden. Alle weiterführenden Artikel finden Sie in der
                  Hilfe-Übersicht.
                </p>
              </div>
              <div className="ds-help-list [display:grid] [overflow:hidden] [border:1px_solid_var(--ds-border-default)] [border-radius:var(--ds-radius-xl)] [background:var(--ds-bg-elevated)] [box-shadow:var(--ds-shadow-card)]">
                <Link
                  className="ds-help-list-item [display:grid] [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:center] [gap:var(--ds-space-4)] [padding:22px_24px] [color:var(--ds-text-default)] [transition:background_var(--ds-duration-fast)_var(--ds-ease-out),_color_var(--ds-duration-fast)_var(--ds-ease-out)] [&+.ds-help-list-item]:[border-top:1px_solid_var(--ds-border-default)] hover:[background:var(--ds-bg-soft)] hover:[color:var(--ds-text-strong)] [&_h3]:[margin:0] [&_h3]:[color:var(--ds-text-strong)] [&_h3]:[font-size:1rem] [&_h3]:[font-weight:850] [&_p]:[margin:6px_0_0] [&_p]:[color:var(--ds-text-muted)] [&_p]:[font-size:0.875rem] [&_p]:[line-height:1.55] max-[760px]:[grid-template-columns:1fr]"
                  href="/help/projekte-ansehen"
                >
                  <div className="ds-help-list-icon [display:grid] [width:44px] [height:44px] [place-items:center] [border:1px_solid_var(--ds-border-default)] [border-radius:15px] [background:var(--ds-accent-soft)] [color:var(--ds-accent-strong)]">
                    <FiFilter className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                  </div>
                  <div>
                    <h3>Projekte filtern und vergleichen</h3>
                    <p>Suchfeld, Filter und Ansichten im Detail nutzen.</p>
                  </div>
                  <FiArrowRight className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                </Link>
                <Link
                  className="ds-help-list-item [display:grid] [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:center] [gap:var(--ds-space-4)] [padding:22px_24px] [color:var(--ds-text-default)] [transition:background_var(--ds-duration-fast)_var(--ds-ease-out),_color_var(--ds-duration-fast)_var(--ds-ease-out)] [&+.ds-help-list-item]:[border-top:1px_solid_var(--ds-border-default)] hover:[background:var(--ds-bg-soft)] hover:[color:var(--ds-text-strong)] [&_h3]:[margin:0] [&_h3]:[color:var(--ds-text-strong)] [&_h3]:[font-size:1rem] [&_h3]:[font-weight:850] [&_p]:[margin:6px_0_0] [&_p]:[color:var(--ds-text-muted)] [&_p]:[font-size:0.875rem] [&_p]:[line-height:1.55] max-[760px]:[grid-template-columns:1fr]"
                  href="/help/projekte-melden"
                >
                  <div className="ds-help-list-icon [display:grid] [width:44px] [height:44px] [place-items:center] [border:1px_solid_var(--ds-border-default)] [border-radius:15px] [background:var(--ds-accent-soft)] [color:var(--ds-accent-strong)]">
                    <FiLayers className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                  </div>
                  <div>
                    <h3>Informationen an das Roadmap-Team schicken</h3>
                    <p>Neue Vorhaben oder Ergänzungen strukturiert vorbereiten.</p>
                  </div>
                  <FiArrowRight className="ds-icon-sm [flex:0_0_auto] [width:1rem] [height:1rem]" />
                </Link>
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
                href="/help/faq"
              >
                FAQ
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

export default ErsteSchritte;
