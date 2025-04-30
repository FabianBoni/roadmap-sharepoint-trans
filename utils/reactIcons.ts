import * as Ai from 'react-icons/ai';
import * as Bs from 'react-icons/bs';
import * as Bi from 'react-icons/bi';
import * as Ci from 'react-icons/ci';
import * as Di from 'react-icons/di';
import * as Fi from 'react-icons/fi';
import * as Fc from 'react-icons/fc';
import * as Fa from 'react-icons/fa';
import * as Fa6 from 'react-icons/fa6';
import * as Gi from 'react-icons/gi';
import * as Go from 'react-icons/go';
import * as Gr from 'react-icons/gr';
import * as Hi from 'react-icons/hi';
import * as Hi2 from 'react-icons/hi2';
import * as Im from 'react-icons/im';
import * as Io from 'react-icons/io';
import * as Io5 from 'react-icons/io5';
import * as Lu from 'react-icons/lu';
import * as Md from 'react-icons/md';
import * as Pi from 'react-icons/pi';
import * as Ri from 'react-icons/ri';
import * as Rx from 'react-icons/rx';
import * as Si from 'react-icons/si';
import * as Sl from 'react-icons/sl';
import * as Tb from 'react-icons/tb';
import * as Tfi from 'react-icons/tfi';
import * as Ti from 'react-icons/ti';
import * as Vsc from 'react-icons/vsc';
import * as Wi from 'react-icons/wi';
import * as Cg from 'react-icons/cg';

// Define a type for icon components
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Create a map of all icon libraries
const iconLibraries: Record<string, Record<string, any>> = {
  Ai, Bs, Bi, Ci, Di, Fi, Fc, Fa, Fa6, Gi, Go, Gr, Hi, Hi2, Im, Io, Io5, 
  Lu, Md, Pi, Ri, Rx, Si, Sl, Tb, Tfi, Ti, Vsc, Wi, Cg
};

// Create a flat map of all icons for faster lookup
const allIcons: Record<string, IconComponent> = {};

// Populate the allIcons map
Object.entries(iconLibraries).forEach(([prefix, library]) => {
  Object.entries(library).forEach(([iconName, IconComponent]) => {
    // Only add actual icon components (functions/components)
    if (typeof IconComponent === 'function') {
      allIcons[iconName] = IconComponent as IconComponent;
    }
  });
});

/**
 * Get an icon component by its name
 * @param iconName The name of the icon to retrieve
 * @returns The icon component or undefined if not found
 */
export const getIconByName = (iconName: string): IconComponent | null => {
  // Direct lookup from our flat map
  if (allIcons[iconName]) {
    return allIcons[iconName];
  }
  
  // If not found in the flat map, try to find it in the libraries
  for (const [prefix, library] of Object.entries(iconLibraries)) {
    if (library[iconName] && typeof library[iconName] === 'function') {
      return library[iconName] as IconComponent;
    }
  }
  
  console.warn(`Icon not found: ${iconName}`);
  return null;
};

/**
 * Search for icons by name
 * @param searchTerm The term to search for
 * @param limit Maximum number of results to return
 * @returns Array of icon names that match the search term
 */
export const searchIcons = (searchTerm: string, limit: number = 100): string[] => {
  if (!searchTerm) return [];
  
  const term = searchTerm.toLowerCase();
  const results: string[] = [];
  
  // Search in all icon names
  for (const iconName in allIcons) {
    if (iconName.toLowerCase().includes(term)) {
      results.push(iconName);
      if (results.length >= limit) break;
    }
  }
  
  return results;
};

/**
 * Get sample icons from each library
 * @param count Number of samples to get from each library
 * @returns Object with library names as keys and arrays of icon names as values
 */
export const getIconSamples = (count: number = 5): Record<string, string[]> => {
  const samples: Record<string, string[]> = {};
  
  Object.entries(iconLibraries).forEach(([prefix, library]) => {
    const libraryIcons = Object.keys(library)
      .filter(key => typeof library[key] === 'function')
      .slice(0, count);
    
    if (libraryIcons.length > 0) {
      samples[prefix.toLowerCase()] = libraryIcons;
    }
  });
  
  return samples;
};

/**
 * Get all available icon names
 * @returns Array of all icon names
 */
export const getAllIconNames = (): string[] => {
  return Object.keys(allIcons);
};

/**
 * Get the total count of available icons
 * @returns The number of available icons
 */
export const getIconCount = (): number => {
  return Object.keys(allIcons).length;
};