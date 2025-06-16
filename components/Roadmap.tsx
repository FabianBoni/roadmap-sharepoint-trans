import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import RoadmapYearNavigation from './RoadmapYearNavigation';
import { Category, Project } from '../types';
import { clientDataService } from '../utils/clientDataService';
import Footer from './Footer';
import CategorySidebar from './CategorySidebar';
import RoadmapFilters, { FilterState } from './RoadmapFilters';
import { FaBars, FaTimes, FaThLarge, FaList } from 'react-icons/fa';
import Nav from './Nav';

interface RoadmapProps {
  initialProjects: Project[];
}

const Roadmap: React.FC<RoadmapProps> = ({ initialProjects }) => {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]); 
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null); 
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [viewType, setViewType] = useState<'quarters' | 'months' | 'weeks'>('quarters');
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [siteTitle, setSiteTitle] = useState('IT + Digital Roadmap');
  // Tag-System als Standard-Feature (vereinfacht)
  const [compactMode] = useState(true);
  const [displayMode, setDisplayMode] = useState<'timeline' | 'cards'>('timeline');

  // Filter state für erweiterte Filter
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    tags: [],
    categories: [],
    projektleitung: [],
    fortschrittRange: [0, 100],
    dateRange: { start: '', end: '' }
  });

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setMobileCategoriesOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Laden des Site-Titels beim Mounten der Komponente
    const loadAppTitle = async () => {
      try {
        const title = await clientDataService.getSettingByKey('siteTitle');
        setSiteTitle(title?.value || 'IT + Digital Roadmap');
      } catch (error) {
        console.error('Fehler beim Laden des Site-Titels:', error);
      }
    };

    loadAppTitle();
  }, []);
  // Hilfsfunktion zum Extrahieren des Jahres aus einem ISO-Datumsstring
  const getYearFromISOString = useCallback((isoString: string): number => {
    const date = new Date(isoString);
    return !isNaN(date.getTime()) ? date.getFullYear() : currentYear;
  }, [currentYear]);

  // Hilfsfunktion zum Extrahieren des Quartals aus einem Datum
  const getQuarterFromDate = (date: Date): number => {
    return Math.floor(date.getMonth() / 3) + 1;
  };

  // Fetch categories and filter projects based on the selected year
  useEffect(() => {
    // Filter projects based on year
    const filteredProjects = initialProjects.filter(project => {
      if (!project.startDate || !project.endDate) {
        return false; // Ignoriere Projekte ohne Datumsangaben
      }

      const startYear = getYearFromISOString(project.startDate);
      const endYear = getYearFromISOString(project.endDate);

      return startYear <= currentYear && endYear >= currentYear;
    });

    setDisplayedProjects(filteredProjects);

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const categoriesData = await clientDataService.getAllCategories();
        setCategories(categoriesData);
        // Initially set all categories as active
        setActiveCategories(categoriesData.map(c => c.id));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }; fetchCategories();
  }, [currentYear, initialProjects, getYearFromISOString]);

  // Debugging-Ausgaben
  useEffect(() => {
    console.log('Initial projects:', initialProjects);
    console.log('Displayed projects:', displayedProjects);
    console.log('Active categories:', activeCategories);
  }, [initialProjects, displayedProjects, activeCategories]); const toggleCategory = (categoryId: string) => {
    if (activeCategories.includes(categoryId)) {
      setActiveCategories(activeCategories.filter(id => id !== categoryId));
    } else {
      setActiveCategories([...activeCategories, categoryId]);
    }
  };  // Erweiterte Projektfilterung mit RoadmapFilters
  const getFilteredProjects = (): Project[] => {
    let filtered = displayedProjects;

    // Filter nach Kategorien (sowohl Sidebar als auch erweiterte Filter)
    const allActiveCategories = [...new Set([...activeCategories, ...filters.categories])];
    if (allActiveCategories.length > 0) {
      filtered = filtered.filter(project => allActiveCategories.includes(project.category));
    }

    // Erweiterte Filter
    // Status Filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(project => filters.status.includes(project.status));
    }

    // Priorität Filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(project =>
        project.priority && filters.priority.includes(project.priority)
      );
    }

    // Tags Filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(project =>
        project.tags && project.tags.some(tag => filters.tags.includes(tag))
      );
    }

    // Projektleitung Filter
    if (filters.projektleitung.length > 0) {
      filtered = filtered.filter(project =>
        filters.projektleitung.includes(project.projektleitung)
      );
    }

    // Fortschritt Filter
    if (filters.fortschrittRange[0] > 0 || filters.fortschrittRange[1] < 100) {
      filtered = filtered.filter(project =>
        project.fortschritt >= filters.fortschrittRange[0] &&
        project.fortschritt <= filters.fortschrittRange[1]
      );
    }

    // Datumsbereich Filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(project =>
        new Date(project.startDate) >= new Date(filters.dateRange.start)
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(project =>
        new Date(project.endDate) <= new Date(filters.dateRange.end)
      );
    }

    return filtered;
  };

  // Vereinfachte Sortier-Logik
  const getSortedProjects = (projects: Project[]): Project[] => {
    return [...projects].sort((a, b) => {
      // Sortiere nach Startdatum
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  };
  // Hauptfilter-Pipeline
  const filteredProjects = getSortedProjects(getFilteredProjects());

  // Filter-Handler-Funktionen
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      tags: [],
      categories: [],
      projektleitung: [],
      fortschrittRange: [0, 100],
      dateRange: { start: '', end: '' }
    });
  };

  // Gruppiere Projekte nach Kategorien für bessere Übersichtlichkeit
  const getGroupedProjects = () => {
    const grouped: { [categoryId: string]: { category: Category; projects: Project[] } } = {};

    filteredProjects.forEach(project => {
      if (!grouped[project.category]) {
        const category = categories.find(cat => cat.id === project.category);
        if (category) {
          grouped[project.category] = {
            category,
            projects: []
          };
        }
      }
      if (grouped[project.category]) {
        grouped[project.category].projects.push(project);
      }
    });

    // Sortiere Projekte innerhalb jeder Kategorie nach Priorität und Startdatum
    Object.values(grouped).forEach(group => {
      group.projects.sort((a, b) => {
        // Zuerst nach Priorität (falls vorhanden)
        if (a.priority && b.priority) {
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
        }
        // Dann nach Startdatum
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
    });

    return grouped;
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  // Get category color by ID
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#777777';
  };
  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10B981'; // green-500
      case 'in-progress': return '#3B82F6'; // blue-500
      case 'planned': return '#6B7280'; // gray-500
      case 'paused': return '#F59E0B'; // yellow-500
      case 'cancelled': return '#EF4444'; // red-500
      default: return '#6B7280'; // gray-500
    }
  };

  // Get tag color - consistent with other components
  const getTagColor = (tag: string): string => {
    const tagColors: { [key: string]: string } = {
      'RPA': '#6366F1',
      'M365': '#0F766E',
      'Lifecycle': '#7C3AED',
      'Bauprojekt': '#DC2626',
      'KI/AI': '#059669',
      'Cloud': '#2563EB',
      'Security': '#DC2626',
      'Integration': '#EA580C',
      'Mobile': '#7C2D12',
      'Analytics': '#1F2937',
      'Infrastructure': '#0891B2',
      'Automatisierung': '#16A34A',
      'Compliance': '#B91C1C',
      'Training': '#CA8A04'
    };
    return tagColors[tag] || '#6B7280';
  };

  // Handle mouse over for project tooltip
  const handleMouseOver = (e: React.MouseEvent, project: Project) => {
    setHoveredProject(project);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse leave for project tooltip
  const handleMouseLeave = () => {
    setHoveredProject(null);
  };  // Handle clicks on projects
  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  // Calculate position for quarter view
  const calculateQuarterPosition = (project: Project): { startPosition: number, width: number } => {
    if (!project.startDate || !project.endDate) {
      return { startPosition: 0, width: 0 };
    }

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { startPosition: 0, width: 0 };
    }

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startQuarter = getQuarterFromDate(startDate);
    const endQuarter = getQuarterFromDate(endDate);

    let startPosition = 0;
    let width = 0;

    if (startYear < currentYear) {
      // Project started before current year
      startPosition = 0;
    } else if (startYear === currentYear) {
      // Project starts in current year
      startPosition = (startQuarter - 1) * 25;
    }

    if (endYear > currentYear) {
      // Project ends after current year
      width = 100 - startPosition;
    } else if (endYear === currentYear) {
      // Project ends in current year
      width = endQuarter * 25 - startPosition;
    }

    return { startPosition, width };
  };

  // Calculate position for month view
  const calculateMonthPosition = (project: Project): { startPosition: number, width: number } => {
    if (!project.startDate || !project.endDate) {
      return { startPosition: 0, width: 0 };
    }

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { startPosition: 0, width: 0 };
    }

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();

    let startPosition = 0;
    let width = 0;

    if (startYear < currentYear) {
      // Project started before current year
      startPosition = 0;
    } else if (startYear === currentYear) {
      // Project starts in current year
      startPosition = (startMonth / 12) * 100;
    }

    if (endYear > currentYear) {
      // Project ends after current year
      width = 100 - startPosition;
    } else if (endYear === currentYear) {
      // Project ends in current year
      width = ((endMonth + 1) / 12) * 100 - startPosition;
    }

    return { startPosition, width };
  };

  // Calculate position for week view
  const calculateWeekPosition = (project: Project): { startPosition: number, width: number } => {
    if (!project.startDate || !project.endDate) {
      return { startPosition: 0, width: 0 };
    }

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { startPosition: 0, width: 0 };
    }

    // Berechne die Wochennummer (ungefähr)
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startWeek = getWeekNumber(startDate);
    const endWeek = getWeekNumber(endDate);

    let startPosition = 0;
    let width = 0;

    if (startYear < currentYear) {
      // Project started before current year
      startPosition = 0;
    } else if (startYear === currentYear) {
      // Project starts in current year
      startPosition = ((startWeek - 1) / 52) * 100;
    }

    if (endYear > currentYear) {
      // Project ends after current year
      width = 100 - startPosition;
    } else if (endYear === currentYear) {
      // Project ends in current year
      width = (endWeek / 52) * 100 - startPosition;
    }

    return { startPosition, width };
  };

  // Status-Lokalisierung für deutsche Anzeige
  const getStatusText = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return 'Abgeschlossen';
      case 'in-progress': return 'In Bearbeitung';
      case 'planned': return 'Geplant';
      case 'paused': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-20 font-sans bg-gray-900 text-white overflow-hidden p-0 m-0">
        <header className="w-full flex flex-row justify-between py-4 md:py-8 px-4 md:px-10">
          <h1 className="text-3xl md:text-5xl font-bold m-0 uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent shadow-xl">
            {siteTitle}
          </h1>
          <Nav currentPage="roadmap" />
        </header>        {/* Controls section - View type and Year navigation */}
        <div className='flex flex-col'>
          <div className="flex flex-col md:flex-row justify-between items-center p-2 px-4 md:px-10 mb-4 gap-4">
            {/* View type buttons - Bigger and more mobile-friendly */}
            <div className="flex space-x-2 w-full md:w-auto">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg flex-1 md:flex-none ${viewType === 'quarters' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                onClick={() => setViewType('quarters')}
              >
                Quartale
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg flex-1 md:flex-none ${viewType === 'months' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                onClick={() => setViewType('months')}
              >
                Monate
              </button>            <button
                className={`px-4 py-2 text-sm font-medium rounded-lg flex-1 md:flex-none ${viewType === 'weeks' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                onClick={() => setViewType('weeks')}
              >
                Wochen
              </button>
            </div>

            {/* Display Mode Toggle */}
            <div className="flex space-x-2">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-lg ${displayMode === 'timeline' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                onClick={() => setDisplayMode('timeline')}
                title="Timeline-Ansicht"
              >
                <FaList />
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-lg ${displayMode === 'cards' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                onClick={() => setDisplayMode('cards')}
                title="Karten-Ansicht"
              >
                <FaThLarge />
              </button>
            </div>          {/* Year navigation - Responsive */}
            <div className="w-full md:w-auto flex justify-center md:justify-end">
              <RoadmapYearNavigation
                initialYear={currentYear}
                onYearChange={setCurrentYear}
              />
            </div>
          </div>
          {/* Erweiterte Filter unterhalb der Timeline */}
          <div className="p-4 mb-6 pt-6 px-4 md:px-8 lg:px-20">            <RoadmapFilters
              projects={displayedProjects}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        {/* Mobile categories toggle button */}
        <div className="md:hidden mb-4 px-4">
          <button
            onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex justify-between items-center"
          >
            <span>Kategorien {activeCategories.length}/{categories.length}</span>
            {mobileCategoriesOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Responsive layout - stack on mobile, side-by-side on larger screens */}
        <div className="flex flex-col md:flex-row relative">
          {/* Sidebar with categories - collapsible on mobile */}
          <div
            ref={sidebarRef}
            className={`md:w-64 mb-4 md:mb-0 ${mobileCategoriesOpen ? 'block' : 'hidden'} md:block z-20 bg-gray-900 md:bg-transparent md:static absolute top-0 left-0 right-0 p-4 md:p-0`}
          >
            <CategorySidebar
              categories={categories}
              activeCategories={activeCategories}
              onToggleCategory={toggleCategory}
            />
          </div>          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            {displayMode === 'timeline' ? (
              // Timeline-Ansicht
              <div className="overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className={`min-w-full ${viewType === 'months' || viewType === 'weeks' ? 'md:min-w-[800px]' : ''}`}>
                  {/* Quarter/Month/Week headers */}
                  {viewType === 'quarters' ? (
                    <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                      <div
                        className={`p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm ${compactMode ? 'py-1' : ''}`}
                        style={{ background: 'linear-gradient(to right, #eab308, #d97706)' }}
                      >
                        Q1 {currentYear}
                      </div>
                      <div
                        className={`p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm ${compactMode ? 'py-1' : ''}`}
                        style={{ background: 'linear-gradient(to right, #d97706, #ea580c)' }}
                      >
                        Q2 {currentYear}
                      </div>
                      <div
                        className={`p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm ${compactMode ? 'py-1' : ''}`}
                        style={{ background: 'linear-gradient(to right, #ea580c, #c2410c)' }}
                      >
                        Q3 {currentYear}
                      </div>
                      <div
                        className={`p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm ${compactMode ? 'py-1' : ''}`}
                        style={{ background: 'linear-gradient(to right, #c2410c, #b91c1c)' }}
                      >
                        Q4 {currentYear}
                      </div>
                    </div>
                  ) : viewType === 'months' ? (
                    <div className="grid grid-cols-12 gap-1 md:gap-2 mb-4 md:mb-6">
                      {['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].map((month, index) => (
                        <div
                          key={month}
                          className={`p-1 md:p-2 rounded-lg text-center font-semibold text-xs ${compactMode ? 'py-0.5' : ''}`}
                          style={{ background: `linear-gradient(to right, hsl(${40 - index * 2}, 90%, 50%), hsl(${35 - index * 2}, 90%, 45%))` }}
                        >
                          {month}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-52 gap-0 mb-4 md:mb-6 overflow-x-auto">
                      {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                        <div
                          key={week}
                          className={`p-1 text-center font-semibold text-xs ${compactMode ? 'py-0.5' : ''}`}
                          style={{
                            minWidth: '30px',
                            background: `linear-gradient(to right, 
                              hsl(${Math.max(40 - week * 0.5, 0)}, 90%, ${Math.max(50 - week * 0.3, 30)}%)
                            )`
                          }}
                        >
                          {week}
                        </div>
                      ))}
                    </div>
                  )}                  {/* Gruppierte Project timeline bars */}
                  <div className="space-y-6">
                    {Object.entries(getGroupedProjects()).map(([categoryId, { category, projects }]) => (
                      <div key={categoryId} className="space-y-2">
                        {/* Kategorie-Header */}
                        <div className="flex items-center space-x-3 mb-3 pt-4 border-t border-gray-700 first:border-t-0 first:pt-0">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                            {projects.length} Projekt{projects.length !== 1 ? 'e' : ''}
                          </span>
                        </div>

                        {/* Projekte in dieser Kategorie */}
                        <div className={`space-y-1 ${compactMode ? 'space-y-0.5' : 'space-y-2'}`}>
                          {projects.map(project => {
                            // Use the appropriate position calculation based on view type
                            const { startPosition, width } = viewType === 'quarters'
                              ? calculateQuarterPosition(project)
                              : viewType === 'months'
                                ? calculateMonthPosition(project)
                                : calculateWeekPosition(project);

                            // Skip projects with invalid positions
                            if (width <= 0) {
                              return null;
                            }

                            return (
                              <div
                                key={project.id}
                                className={`relative ${compactMode ? 'h-5 md:h-6' : 'h-8 md:h-10'} mb-1`}
                              >
                                {/* Background grid */}
                                <div className="absolute top-0 left-0 right-0 h-full pointer-events-none opacity-20">
                                  {viewType === 'quarters' ? (
                                    <div className="grid grid-cols-4 gap-2 md:gap-4 h-full">
                                      {Array.from({ length: 4 }, (_, i) => (
                                        <div key={i} className="bg-gray-600 rounded"></div>
                                      ))}
                                    </div>
                                  ) : viewType === 'months' ? (
                                    <div className="grid grid-cols-12 gap-1 md:gap-2 h-full">
                                      {Array.from({ length: 12 }, (_, i) => (
                                        <div key={i} className="bg-gray-600 rounded"></div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-52 gap-0 h-full">
                                      {Array.from({ length: 52 }, (_, i) => (
                                        <div key={i} className="bg-gray-600"></div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Project bar */}
                                <div
                                  className={`absolute top-0 h-full rounded-lg flex items-center cursor-pointer transition-all hover:brightness-110 hover:scale-y-110 group border border-white border-opacity-20 hover:border-opacity-60 ${compactMode ? 'px-1 md:px-2' : 'px-2 md:px-3'
                                    }`}
                                  style={{
                                    left: `${startPosition}%`,
                                    width: `${width}%`,
                                    backgroundColor: category.color,
                                    opacity: 0.9
                                  }}
                                  onMouseEnter={(e) => handleMouseOver(e, project)}
                                  onMouseLeave={handleMouseLeave}
                                  onClick={() => handleProjectClick(project.id)}
                                >
                                  {/* Status indicator */}
                                  <div
                                    className={`rounded-full mr-1 md:mr-2 flex-shrink-0 border border-white border-opacity-70 ${compactMode ? 'h-1.5 w-1.5' : 'h-2 w-2 md:h-2.5 md:w-2.5'
                                      }`}
                                    style={{ backgroundColor: getStatusColor(project.status) }}
                                  />

                                  {/* Priority indicator */}
                                  {project.priority && (
                                    <div
                                      className={`rounded-full mr-1 flex-shrink-0 border border-white border-opacity-70 ${compactMode ? 'h-1.5 w-1.5' : 'h-2 w-2'
                                        }`}
                                      style={{
                                        backgroundColor: project.priority === 'critical' ? '#DC2626' :
                                          project.priority === 'high' ? '#EA580C' :
                                            project.priority === 'medium' ? '#D97706' : '#65A30D'
                                      }}
                                      title={`Priorität: ${project.priority}`}
                                    />
                                  )}

                                  {/* Project title */}
                                  <span className={`font-medium truncate px-1 md:px-2 py-0.5 rounded bg-black bg-opacity-40 text-white group-hover:bg-opacity-60 ${compactMode ? 'text-xs' : 'text-xs md:text-sm'
                                    }`}>
                                    {project.title}
                                  </span>                                  {/* Tags indicator - Responsive */}
                                  {project.tags && project.tags.length > 0 && (
                                    <div className="ml-auto mr-1 flex items-center">                                      {/* Desktop: Zeige erste 2 Tags */}
                                      <div className="hidden md:flex items-center space-x-1">
                                        {project.tags.slice(0, 2).map(tag => (
                                          <span
                                            key={tag}
                                            className="px-1.5 py-0.5 rounded-full text-xs font-medium text-white border border-white border-opacity-30"                                            style={{
                                              backgroundColor: getTagColor(tag),
                                              filter: 'brightness(0.9)'
                                            }}
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                        {project.tags.length > 2 && (
                                          <span className="px-1.5 py-0.5 rounded-full text-xs bg-gray-600 text-white">
                                            +{project.tags.length - 2}
                                          </span>
                                        )}
                                      </div>

                                      {/* Mobile: Nur Tag-Symbol mit Anzahl */}
                                      <div className="flex md:hidden items-center bg-black bg-opacity-40 px-1.5 py-0.5 rounded">
                                        <span className="text-xs text-yellow-400">🏷️</span>
                                        <span className="text-xs text-white ml-1">{project.tags.length}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Progress indicator */}
                                  {!compactMode && (
                                    <div className="ml-2 text-xs bg-black bg-opacity-40 px-1 rounded">
                                      {project.fortschritt}%
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>) : (
              // Verbesserte Karten-Ansicht mit Tag-Support
              <div className="overflow-y-auto">                <div className={`grid gap-4 ${compactMode
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                  }`}>
                  {filteredProjects.map(project => (
                    <div
                      key={project.id}
                      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-all border border-gray-600 hover:border-gray-500 hover:shadow-lg"
                      onClick={() => handleProjectClick(project.id)}
                      onMouseOver={(e) => handleMouseOver(e, project)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Header mit Titel und Kategorie-Indikator */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-white truncate flex-1 mr-2">{project.title}</h3>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {/* Prioritäts-Indikator */}
                          {project.priority && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: project.priority === 'critical' ? '#DC2626' :
                                  project.priority === 'high' ? '#EA580C' :
                                    project.priority === 'medium' ? '#D97706' : '#65A30D'
                              }}
                              title={`Priorität: ${project.priority}`}
                            />
                          )}
                          {/* Kategorie-Indikator */}
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(project.category) }}
                            title={getCategoryName(project.category)}
                          />
                        </div>
                      </div>

                      {/* Kategorie und Status */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-400 mb-1">{getCategoryName(project.category)}</p>
                        <div className="flex items-center space-x-2">
                          <span
                            className="px-2 py-1 rounded-full text-xs text-white"
                            style={{ backgroundColor: getStatusColor(project.status) }}
                          >
                            {getStatusText(project.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {project.fortschritt}% Complete
                          </span>
                        </div>
                      </div>

                      {/* Fortschrittsbalken */}
                      <div className="mb-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${project.fortschritt}%`,
                              backgroundColor: getStatusColor(project.status)
                            }}
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {project.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded-full text-xs">
                                +{project.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer mit Zeitraum und Projektleitung */}
                      <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                        <p className="mb-1">
                          <span className="font-medium">Leitung:</span> {project.projektleitung}
                        </p>
                        {project.startDate && project.endDate && (
                          <p>
                            <span className="font-medium">Zeitraum:</span>{' '}
                            {new Date(project.startDate).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })} - {' '}
                            {new Date(project.endDate).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Leerer Zustand */}
                {filteredProjects.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium mb-2">Keine Projekte gefunden</h3>
                    <p className="text-sm text-center">
                      Keine Projekte für die ausgewählten Filter gefunden.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>        {/* Erweiterte Tooltip-Informationen */}
        {hoveredProject && (
          <div
            className="fixed bg-gray-800 p-3 md:p-4 rounded-lg shadow-xl z-40 w-56 md:w-72 border border-gray-600"
            style={{
              top: Math.min(tooltipPosition.y + 10, window.innerHeight - 250),
              left: Math.min(tooltipPosition.x + 10, window.innerWidth - 300),
              maxWidth: '90vw'
            }}
          >
            <h3 className="font-bold text-base md:text-lg mb-2 text-white">{hoveredProject.title}</h3>

            <div className="space-y-1 text-xs md:text-sm text-gray-300">
              <p>
                <span className="font-medium text-gray-200">Kategorie:</span> {getCategoryName(hoveredProject.category)}
              </p>

              <p>
                <span className="font-medium text-gray-200">Status:</span>
                <span className="ml-1 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: getStatusColor(hoveredProject.status), color: 'white' }}>
                  {getStatusText(hoveredProject.status)}
                </span>
              </p>

              {hoveredProject.priority && (
                <p>
                  <span className="font-medium text-gray-200">Priorität:</span>
                  <span className="ml-1 px-2 py-0.5 rounded text-xs" style={{
                    backgroundColor: hoveredProject.priority === 'critical' ? '#DC2626' :
                      hoveredProject.priority === 'high' ? '#EA580C' :
                        hoveredProject.priority === 'medium' ? '#D97706' : '#65A30D',
                    color: 'white'
                  }}>
                    {hoveredProject.priority}
                  </span>
                </p>
              )}

              <p>
                <span className="font-medium text-gray-200">Fortschritt:</span> {hoveredProject.fortschritt}%
              </p>

              <p>
                <span className="font-medium text-gray-200">Zeitraum:</span> {
                  hoveredProject.startDate && hoveredProject.endDate ?
                    `${new Date(hoveredProject.startDate).toLocaleDateString('de-DE')} - ${new Date(hoveredProject.endDate).toLocaleDateString('de-DE')}` :
                    'Kein Zeitraum definiert'
                }
              </p>

              <p>
                <span className="font-medium text-gray-200">Projektleitung:</span> {hoveredProject.projektleitung}
              </p>

              {hoveredProject.tags && hoveredProject.tags.length > 0 && (
                <div>
                  <span className="font-medium text-gray-200">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hoveredProject.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hoveredProject.description && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                  {hoveredProject.description}
                </p>
              </div>
            )}          </div>)}
      </div>
      
      <Footer />
    </>
  );
};

export default Roadmap;