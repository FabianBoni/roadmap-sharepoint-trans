import * as Fa from 'react-icons/fa'; // Font Awesome
import * as Md from 'react-icons/md'; // Material Design
import * as Fi from 'react-icons/fi'; // Feather Icons
import * as Ai from 'react-icons/ai'; // Ant Design Icons
import * as Bs from 'react-icons/bs'; // Bootstrap Icons
import * as Io from 'react-icons/io'; // Ionicons 4
import * as Io5 from 'react-icons/io5'; // Ionicons 5
import * as Ri from 'react-icons/ri'; // Remix Icons
import * as Ti from 'react-icons/ti'; // Typicons
import * as Gi from 'react-icons/gi'; // Game Icons
import * as Wi from 'react-icons/wi'; // Weather Icons
import * as Di from 'react-icons/di'; // Devicons
import * as Si from 'react-icons/si'; // Simple Icons
import * as Vsc from 'react-icons/vsc'; // VS Code Icons
import * as Cg from 'react-icons/cg'; // Custom Icons
import * as Hi from 'react-icons/hi'; // Heroicons
import * as Bi from 'react-icons/bi'; // BoxIcons
import React from 'react';

// Map of library prefixes to their respective icon sets
const iconLibraries: Record<string, any> = {
  fa: Fa,
  md: Md,
  fi: Fi,
  ai: Ai,
  bs: Bs,
  io: Io,
  io5: Io5,
  ri: Ri,
  ti: Ti,
  gi: Gi,
  wi: Wi,
  di: Di,
  si: Si,
  vsc: Vsc,
  cg: Cg,
  hi: Hi,
  bi: Bi
};

// Function to get an icon component by name
export const getIconByName = (iconName: string): React.ComponentType<any> | null => {
  if (!iconName) return null;
  
  // Extract library prefix (first 2 characters for most, or check for io5)
  let prefix = iconName.substring(0, 2).toLowerCase();
  let name = iconName;
  
  // Special case for Ionicons 5 (io5)
  if (iconName.substring(0, 3).toLowerCase() === 'io5') {
    prefix = 'io5';
    name = iconName;
  }
  
  // Get the icon library
  const library = iconLibraries[prefix];
  
  if (!library) {
    // Try Font Awesome as fallback
    return Fa[iconName as keyof typeof Fa] || null;
  }
  
  // Return the icon component
  return library[name as keyof typeof library] || null;
};

// Define icon categories for the picker
export const iconCategories: Record<string, string[]> = {
  'common': [
    'FaHome', 'FaFolder', 'FaFile', 'FaCalendar', 'FaClock', 'FaUser', 
    'FaUsers', 'FaCog', 'FaSearch', 'FaBell', 'FaEnvelope', 'FaPhone'
  ],
  'arrows': [
    'FaArrowUp', 'FaArrowDown', 'FaArrowLeft', 'FaArrowRight', 
    'FaChevronUp', 'FaChevronDown', 'FaChevronLeft', 'FaChevronRight'
  ],
  'business': [
    'FaBuilding', 'FaBriefcase', 'FaChartBar', 'FaChartLine', 
    'FaChartPie', 'FaMoneyBillAlt', 'FaHandshake', 'FaProjectDiagram'
  ],
  'technology': [
    'FaLaptop', 'FaDesktop', 'FaMobile', 'FaTablet', 'FaServer', 
    'FaDatabase', 'FaCode', 'FaBug', 'FaWifi', 'FaCloud'
  ],
  'social': [
    'FaFacebook', 'FaTwitter', 'FaInstagram', 'FaLinkedin', 
    'FaYoutube', 'FaSlack', 'FaGithub', 'FaWhatsapp'
  ]
};

// Flatten all categories to get all available icons
export const allIcons = Object.values(iconCategories).flat();