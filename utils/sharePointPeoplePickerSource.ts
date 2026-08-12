import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { getInstanceConfigBySlug } from '@/utils/instanceConfig';

type PeoplePickerEnvironment = Record<string, string | undefined>;

export const resolveSharePointPeoplePickerSourceSlug = (
  currentInstanceSlug: string,
  environment: PeoplePickerEnvironment = process.env
): string =>
  (
    environment.SP_PEOPLE_PICKER_INSTANCE_SLUG ||
    environment.DEFAULT_ROADMAP_INSTANCE ||
    currentInstanceSlug
  )
    .trim()
    .toLowerCase();

/**
 * Resolve the complete SharePoint connection context used for directory search.
 * The current roadmap instance remains the authorization target only.
 */
export async function getSharePointPeoplePickerSourceInstance(
  currentInstance: RoadmapInstanceConfig
): Promise<RoadmapInstanceConfig> {
  const sourceSlug = resolveSharePointPeoplePickerSourceSlug(currentInstance.slug);
  if (sourceSlug === currentInstance.slug.toLowerCase()) return currentInstance;

  const sourceInstance = await getInstanceConfigBySlug(sourceSlug);
  if (!sourceInstance) {
    throw new Error(`Configured SharePoint People Picker instance not found: ${sourceSlug}`);
  }
  return sourceInstance;
}
