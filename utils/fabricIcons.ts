// Import icon names from Office UI Fabric
import { registerIcons } from 'office-ui-fabric-react/lib/Styling';

// Define icon categories similar to what you had before
export const iconCategories: Record<string, string[]> = {
  'common': ['Add', 'Calendar', 'CheckMark', 'Clock', 'Delete', 'Edit', 'Favorite', 'Home', 'Mail', 'Save', 'Search'],
  'document': ['Document', 'DocumentSet', 'ExcelDocument', 'PDF', 'PowerPointDocument', 'WordDocument'],
  'people': ['Contact', 'Group', 'Person', 'Team', 'UserFollowed'],
  'communication': ['Chat', 'Message', 'Phone', 'Mail', 'Send'],
  'app': ['AppIconDefault', 'Globe', 'Link', 'List', 'Page', 'Settings'],
  // Add more categories as needed
};

// Flatten the categories to get all icon names
export const validIconNames = Object.values(iconCategories).flat();

// Function to get all icon names
export const getIconNames = (): string[] => {
  return validIconNames;
};

// Optional: Register custom icons if needed
export const registerCustomIcons = () => {
  registerIcons({
    icons: {

    }
  });
};