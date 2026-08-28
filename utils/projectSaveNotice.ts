export const PROJECT_SAVE_NOTICE_PARAM = 'projectSave';
export const PROJECT_SAVE_PUBLISHED_PARAM = 'projectPublished';

export type ProjectSaveAction = 'created' | 'updated';

export interface ProjectSaveNotice {
  action: ProjectSaveAction;
  publishedCount: number;
}

type QueryValue = string | string[] | undefined;

const firstQueryValue = (value: QueryValue): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const countUniqueMirrorTargets = (
  targetSlugs: unknown,
  currentInstanceSlug?: string | null
): number => {
  if (!Array.isArray(targetSlugs)) return 0;

  const currentSlug = currentInstanceSlug?.trim().toLowerCase() || '';
  const uniqueTargets = new Set<string>();

  targetSlugs.forEach((value) => {
    if (typeof value !== 'string') return;
    const normalizedSlug = value.trim().toLowerCase();
    if (!normalizedSlug || normalizedSlug === currentSlug) return;
    uniqueTargets.add(normalizedSlug);
  });

  return uniqueTargets.size;
};

export const buildProjectSaveNoticeQuery = (
  query: Record<string, QueryValue>,
  notice: ProjectSaveNotice
): Record<string, QueryValue> => ({
  ...query,
  [PROJECT_SAVE_NOTICE_PARAM]: notice.action,
  [PROJECT_SAVE_PUBLISHED_PARAM]: String(Math.max(0, Math.floor(notice.publishedCount))),
});

export const parseProjectSaveNotice = (
  query: Record<string, QueryValue>
): ProjectSaveNotice | null => {
  const action = firstQueryValue(query[PROJECT_SAVE_NOTICE_PARAM]);
  const published = firstQueryValue(query[PROJECT_SAVE_PUBLISHED_PARAM]);

  if (action !== 'created' && action !== 'updated') return null;
  if (!published || !/^\d{1,6}$/.test(published)) return null;

  const publishedCount = Number(published);
  if (!Number.isSafeInteger(publishedCount)) return null;

  return { action, publishedCount };
};

export const getProjectSaveNoticeMessage = ({
  action,
  publishedCount,
}: ProjectSaveNotice): string => {
  const baseMessage = action === 'created' ? 'Projekt erstellt' : 'Projekt aktualisiert';
  if (publishedCount === 0) return `${baseMessage}.`;

  return `${baseMessage} und in ${publishedCount} ${
    publishedCount === 1 ? 'Roadmap' : 'Roadmaps'
  } veröffentlicht.`;
};
