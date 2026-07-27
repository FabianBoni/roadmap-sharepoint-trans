import type { IconType } from 'react-icons';
import {
  FiActivity,
  FiAirplay,
  FiArchive,
  FiBarChart2,
  FiBookOpen,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCloud,
  FiCode,
  FiCompass,
  FiCpu,
  FiDatabase,
  FiDollarSign,
  FiEdit3,
  FiEye,
  FiFileText,
  FiFilter,
  FiFlag,
  FiFolder,
  FiGlobe,
  FiGrid,
  FiHardDrive,
  FiHeadphones,
  FiHeart,
  FiHelpCircle,
  FiHome,
  FiLayers,
  FiLifeBuoy,
  FiLink,
  FiLock,
  FiMail,
  FiMap,
  FiMapPin,
  FiMessageCircle,
  FiMonitor,
  FiPackage,
  FiPieChart,
  FiSearch,
  FiServer,
  FiSettings,
  FiShield,
  FiShoppingCart,
  FiSliders,
  FiSmartphone,
  FiStar,
  FiTarget,
  FiTool,
  FiTrendingUp,
  FiTruck,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiWifi,
  FiZap,
} from 'react-icons/fi';
import {
  FaBuilding,
  FaCar,
  FaChartLine,
  FaCloud,
  FaCogs,
  FaDatabase,
  FaDesktop,
  FaGlobe,
  FaHeadset,
  FaHospital,
  FaLaptopHouse,
  FaLightbulb,
  FaNetworkWired,
  FaProjectDiagram,
  FaServer,
  FaShieldAlt,
  FaSitemap,
  FaUniversity,
} from 'react-icons/fa';

/**
 * Deliberately bounded icon registry.
 *
 * Do not replace these named imports with `import * as ...`: doing so ships every
 * icon from every react-icons package to all roadmap visitors. New category
 * icons must be added explicitly so the bundle cost remains visible in review.
 */
const ICONS = {
  FiActivity,
  FiAirplay,
  FiArchive,
  FiBarChart2,
  FiBookOpen,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCloud,
  FiCode,
  FiCompass,
  FiCpu,
  FiDatabase,
  FiDollarSign,
  FiEdit3,
  FiEye,
  FiFileText,
  FiFilter,
  FiFlag,
  FiFolder,
  FiGlobe,
  FiGrid,
  FiHardDrive,
  FiHeadphones,
  FiHeart,
  FiHelpCircle,
  FiHome,
  FiLayers,
  FiLifeBuoy,
  FiLink,
  FiLock,
  FiMail,
  FiMap,
  FiMapPin,
  FiMessageCircle,
  FiMonitor,
  FiPackage,
  FiPieChart,
  FiSearch,
  FiServer,
  FiSettings,
  FiShield,
  FiShoppingCart,
  FiSliders,
  FiSmartphone,
  FiStar,
  FiTarget,
  FiTool,
  FiTrendingUp,
  FiTruck,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiWifi,
  FiZap,
  FaBuilding,
  FaCar,
  FaChartLine,
  FaCloud,
  FaCogs,
  FaDatabase,
  FaDesktop,
  FaGlobe,
  FaHeadset,
  FaHospital,
  FaLaptopHouse,
  FaLightbulb,
  FaNetworkWired,
  FaProjectDiagram,
  FaServer,
  FaShieldAlt,
  FaSitemap,
  FaUniversity,
} satisfies Record<string, IconType>;

export type RoadmapIconName = keyof typeof ICONS;

const ICON_NAMES = Object.keys(ICONS) as RoadmapIconName[];

export const getIconByName = (iconName: string): IconType | null =>
  ICONS[iconName as RoadmapIconName] ?? null;

export const searchIcons = (searchTerm: string, limit = 100): string[] => {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [];
  return ICON_NAMES.filter((iconName) => iconName.toLowerCase().includes(term)).slice(0, limit);
};

export const getIconSamples = (count = 10): Record<string, string[]> => {
  const samples: Record<string, string[]> = {};
  for (const iconName of ICON_NAMES) {
    const prefix = iconName.startsWith('Fa') ? 'fa' : 'fi';
    const group = (samples[prefix] ||= []);
    if (group.length < count) group.push(iconName);
  }
  return samples;
};

export const getAllIconNames = (): string[] => [...ICON_NAMES];

export const getIconCount = (): number => ICON_NAMES.length;
