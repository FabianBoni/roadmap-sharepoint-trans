import type { Category, Project } from '../types';
import { normalizeCategoryId, UNCATEGORIZED_ID } from './categoryUtils';
import { getRichTextPlainText } from './richText';

const STATUS_LABELS: Record<Project['status'], string> = {
  planned: 'Geplant',
  'in-progress': 'In Umsetzung',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen',
};

const PHASE_LABELS: Record<string, string> = {
  initialisierung: 'Initialisierung',
  konzept: 'Konzept',
  realisierung: 'Realisierung',
  einfuehrung: 'Einführung',
  einführung: 'Einführung',
  abschluss: 'Abschluss',
};

export const ROADMAP_EXCEL_HEADERS = [
  'Projekt-ID',
  'Kategorie',
  'Projekt',
  'Projekttyp',
  'Status',
  'Projektphase',
  'Fortschritt (%)',
  'Startdatum',
  'Enddatum',
  'Startquartal',
  'Endquartal',
  'Projektleitung',
  'Team',
  'Nächster Meilenstein',
  'Budget',
  'Geplante Umsetzung',
  'Badges',
  'Tags',
  'Beschreibung',
  'Bisher',
  'Zukunft',
  'Links',
  'Quellinstanz',
] as const;

export type RoadmapExcelCell = string | number | Date;

const asExcelDate = (value?: string | null): Date | string => {
  const normalized = (value || '').trim();
  if (!normalized) return '';

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(normalized);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (!Number.isNaN(date.getTime())) return date;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? normalized : date;
};

const getCategoryName = (project: Project, categories: Category[]): string => {
  const categoryId = normalizeCategoryId(project.category, categories);
  if (categoryId === UNCATEGORIZED_ID) return 'Ohne Kategorie';

  return (
    categories.find((category) => category.id === categoryId)?.name ||
    project.categoryLabel ||
    'Ohne Kategorie'
  );
};

const getPhaseLabel = (phase?: string | null): string => {
  const normalized = (phase || '').trim().toLowerCase();
  return PHASE_LABELS[normalized] || phase || '';
};

const joinValues = (values?: Array<string | null | undefined>): string =>
  (values || [])
    .map((value) => (value || '').trim())
    .filter(Boolean)
    .join(', ');

export const createRoadmapExcelRows = (
  projects: Project[],
  categories: Category[]
): RoadmapExcelCell[][] =>
  projects.map((project) => [
    project.sourceProjectId || project.id,
    getCategoryName(project, categories),
    project.title || '',
    project.projectType === 'short' ? 'Kurzzeitprojekt' : 'Langzeitprojekt',
    STATUS_LABELS[project.status] || project.status || '',
    getPhaseLabel(project.projektphase),
    Number.isFinite(project.fortschritt) ? Number(project.fortschritt) : 0,
    asExcelDate(project.startDate),
    asExcelDate(project.endDate),
    project.startQuarter || '',
    project.endQuarter || '',
    project.projektleitung || '',
    joinValues(
      project.teamMembers?.map((member) =>
        member.role ? `${member.name} (${member.role})` : member.name
      )
    ),
    project.naechster_meilenstein || '',
    project.budget || '',
    project.geplante_umsetzung || '',
    joinValues(project.badges),
    joinValues(project.ProjectFields),
    getRichTextPlainText(project.description),
    getRichTextPlainText(project.bisher),
    getRichTextPlainText(project.zukunft),
    joinValues(
      project.links?.map((link) => (link.title ? `${link.title}: ${link.url}` : link.url))
    ),
    project.mirrorSourceInstanceName || project.mirrorSourceInstanceSlug || '',
  ]);

const sanitizeFilePart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export interface ExportRoadmapToExcelOptions {
  projects: Project[];
  categories: Category[];
  year: number;
  instanceSlug?: string;
}

export const exportRoadmapToExcel = async ({
  projects,
  categories,
  year,
  instanceSlug = '',
}: ExportRoadmapToExcelOptions): Promise<void> => {
  const { Workbook } = await import('@mui/x-internal-exceljs-fork');
  const workbook = new Workbook();
  workbook.creator = 'JSDoIT Roadmap Center';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = `Roadmap ${year}`;

  const worksheet = workbook.addWorksheet(`Roadmap ${year}`, {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  worksheet.columns = ROADMAP_EXCEL_HEADERS.map((header, index) => ({
    header,
    key: `column-${index}`,
    width: [
      18, 24, 34, 18, 18, 20, 17, 14, 14, 15, 15, 24, 38, 28, 16, 24, 22, 28, 52, 42, 42, 48, 24,
    ][index],
  }));

  createRoadmapExcelRows(projects, categories).forEach((values) => worksheet.addRow(values));

  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, worksheet.rowCount), column: ROADMAP_EXCEL_HEADERS.length },
  };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
  });

  worksheet.getColumn(7).numFmt = '0" %"';
  worksheet.getColumn(8).numFmt = 'dd.mm.yyyy';
  worksheet.getColumn(9).numFmt = 'dd.mm.yyyy';

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const downloadUrl = URL.createObjectURL(blob);
  const suffix = sanitizeFilePart(instanceSlug);
  const fileName = `roadmap-${year}${suffix ? `-${suffix}` : ''}.xlsx`;
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
};
