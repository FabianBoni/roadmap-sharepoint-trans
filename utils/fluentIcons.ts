import * as FluentIcons from '@fluentui/react-icons';

// Extract all valid icon names from the FluentIcons import
export const validIconNames = Object.keys(FluentIcons).filter(
  key => typeof FluentIcons[key as keyof typeof FluentIcons] === 'function'
);

// Group icons by category for better organization in the UI
export const iconCategories = {
  general: [
    'AddRegular', 'ArrowDownRegular', 'ArrowLeftRegular', 'ArrowRightRegular', 'ArrowUpRegular',
    'CheckmarkRegular', 'DismissRegular', 'HomeRegular', 'InfoRegular', 'MoreHorizontalRegular'
  ],
  communication: [
    'CallRegular', 'ChatRegular', 'EmailRegular', 'MeetNowRegular', 'PersonRegular', 'TeamRegular'
  ],
  document: [
    'DocumentRegular', 'FolderRegular', 'FolderOpenRegular', 'NoteRegular', 'PasteRegular'
  ],
  business: [
    'BuildingRegular', 'CalendarRegular', 'ChartRegular', 'MoneyRegular', 'TaskListRegular'
  ],
  technology: [
    'CodeRegular', 'DatabaseRegular', 'DeviceRegular', 'LaptopRegular', 'ServerRegular'
  ]
};

// Function to check if an icon name is valid
export const isValidIconName = (name: string): boolean => {
  return validIconNames.includes(name);
};

// Function to get a component by name with proper typing
export const getIconByName = (name: string) => {
  if (!name || !isValidIconName(name)) {
    return null;
  }
  return FluentIcons[name as keyof typeof FluentIcons];
};
