import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import RoadmapYearNavigation from './RoadmapYearNavigation';
import { Category, Project } from '../types';
import { clientDataService } from '../utils/clientDataService';
import CategorySidebar from './CategorySidebar';
import Footer from './Footer';
import { FaBars, FaTimes } from 'react-icons/fa';
import Header from './Header';

interface RoadmapProps {
  initialProjects: Project[];
}

const Roadmap: React.FC<RoadmapProps> = ({ initialProjects }) => {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [viewType, setViewType] = useState<'quarters' | 'months' | 'weeks'>('quarters');
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

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

  // Hilfsfunktion zum Extrahieren des Jahres aus einem ISO-Datumsstring
  const getYearFromISOString = (isoString: string): number => {
    const date = new Date(isoString);
    return !isNaN(date.getTime()) ? date.getFullYear() : currentYear;
  };

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
    };

    fetchCategories();
  }, [currentYear, initialProjects]);

  // Debugging-Ausgaben
  useEffect(() => {
    console.log('Initial projects:', initialProjects);
    console.log('Displayed projects:', displayedProjects);
    console.log('Active categories:', activeCategories);
  }, [initialProjects, displayedProjects, activeCategories]);

  const toggleCategory = (categoryId: string) => {
    if (activeCategories.includes(categoryId)) {
      setActiveCategories(activeCategories.filter(id => id !== categoryId));
    } else {
      setActiveCategories([...activeCategories, categoryId]);
    }
  };

  // Filter projects by active categories
  const filteredProjects = displayedProjects.filter(project =>
    activeCategories.includes(project.category)
  );

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

  // Handle mouse over for project tooltip
  const handleMouseOver = (e: React.MouseEvent, project: Project) => {
    setHoveredProject(project);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse leave for project tooltip
  const handleMouseLeave = () => {
    setHoveredProject(null);
  };

  // Handle clicks on projects
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

  return (
    <>
      {/* Top Navigation Bar */}
      <Header currentPage="roadmap" />

      <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-20 font-sans bg-gray-900 text-white overflow-hidden p-0 m-0">
        <header className="py-4 md:py-8 px-4 md:px-10">
          <h1 className="text-3xl md:text-5xl font-bold m-0 uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent shadow-xl">
            IT + Digital Roadmap {currentYear}
          </h1>
        </header>

        {/* Controls section - View type and Year navigation */}
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
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg flex-1 md:flex-none ${viewType === 'weeks' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              onClick={() => setViewType('weeks')}
            >
              Wochen
            </button>
          </div>

          {/* Year navigation - Responsive */}
          <div className="w-full md:w-auto flex justify-center md:justify-end">
            <RoadmapYearNavigation
              initialYear={currentYear}
              onYearChange={setCurrentYear}
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
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            <div className="overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className={`min-w-full ${viewType === 'months' || viewType === 'weeks' ? 'md:min-w-[800px]' : ''}`}>
                {/* Quarter/Month/Week headers */}
                {viewType === 'quarters' ? (
                  <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                    <div
                      className="p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm"
                      style={{ background: 'linear-gradient(to right, #eab308, #d97706)' }}
                    >
                      Q1 {currentYear}
                    </div>
                    <div
                      className="p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm"
                      style={{ background: 'linear-gradient(to right, #d97706, #ea580c)' }}
                    >
                      Q2 {currentYear}
                    </div>
                    <div
                      className="p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm"
                      style={{ background: 'linear-gradient(to right, #ea580c, #c2410c)' }}
                    >
                      Q3 {currentYear}
                    </div>
                    <div
                      className="p-2 md:p-3 rounded-lg text-center font-semibold text-xs md:text-sm"
                      style={{ background: 'linear-gradient(to right, #c2410c, #b91c1c)' }}
                    >
                      Q4 {currentYear}
                    </div>
                  </div>
                ) : viewType === 'months' ? (
                  <div className="grid grid-cols-12 gap-1 md:gap-2 mb-4 md:mb-6">
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #eab308, #e3a008)' }}>Jan</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #e3a008, #dd9107)' }}>Feb</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #dd9107, #d97706)' }}>Mär</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #d97706, #d57005)' }}>Apr</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #d57005, #d16904)' }}>Mai</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #d16904, #cc6203)' }}>Jun</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #cc6203, #c65b02)' }}>Jul</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #c65b02, #c05401)' }}>Aug</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #c05401, #ba4d01)' }}>Sep</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #ba4d01, #b44600)' }}>Okt</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #b44600, #ae3f00)' }}>Nov</div>
                    <div className="p-1 md:p-2 rounded-lg text-center font-semibold text-xs"
                      style={{ background: 'linear-gradient(to right, #ae3f00, #a83800)' }}>Dez</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-52 gap-0 mb-4 md:mb-6 overflow-x-auto">
                    {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                      <div
                        key={week}
                        className="p-1 text-center font-semibold text-xs"
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
                )}

                {/* Project timeline bars */}
                <div className="space-y-2 md:space-y-4 relative">
                  {filteredProjects.map(project => {
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
                        className="relative h-8 md:h-12 mb-1 md:mb-2"
                      >
                        {/* Background grid */}
                        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
                          {viewType === 'quarters' ? (
                            <div className="grid grid-cols-4 gap-2 md:gap-4 h-full">
                              <div className="bg-gray-800 rounded-lg opacity-30"></div>
                              <div className="bg-gray-800 rounded-lg opacity-30"></div>
                              <div className="bg-gray-800 rounded-lg opacity-30"></div>
                              <div className="bg-gray-800 rounded-lg opacity-30"></div>
                            </div>
                          ) : viewType === 'months' ? (
                            <div className="grid grid-cols-12 gap-1 md:gap-2 h-full">
                              {Array.from({ length: 12 }, (_, i) => (
                                <div key={i} className="bg-gray-800 rounded-lg opacity-30"></div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-52 gap-0 h-full">
                              {Array.from({ length: 52 }, (_, i) => (
                                <div key={i} className="bg-gray-800 rounded-lg opacity-30"></div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Project bar */}
                        <div
                          className="absolute top-0 h-full rounded-lg flex items-center px-1 md:px-3 cursor-pointer transition-all hover:brightness-110 group border border-white border-opacity-30 hover:border-opacity-70"
                          style={{
                            left: `${startPosition}%`,
                            width: `${width}%`,
                            backgroundColor: getCategoryColor(project.category),
                            opacity: 0.85
                          }}
                          onMouseEnter={(e) => handleMouseOver(e, project)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleProjectClick(project.id)}
                          onTouchStart={(e) => {
                            // Show tooltip on touch start
                            const touch = e.touches[0];
                            handleMouseOver({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent, project);
                          }}
                          onTouchEnd={() => {
                            // Hide tooltip after a short delay to allow for tap recognition
                            setTimeout(() => handleMouseLeave(), 500);
                          }}
                        >
                          {/* Status indicator */}
                          <div
                            className="h-2 w-2 md:h-3 md:w-3 rounded-full mr-1 md:mr-2 flex-shrink-0 border border-white border-opacity-70"
                            style={{ backgroundColor: getStatusColor(project.status) }}
                          />

                          {/* Project title with improved visibility */}
                          <span className="font-medium truncate px-1 md:px-2 py-0.5 rounded bg-black bg-opacity-40 text-white group-hover:bg-opacity-60 text-xs md:text-sm">
                            {project.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredProject && (
          <div
            className="fixed bg-gray-800 p-2 md:p-3 rounded-lg shadow-lg z-40 w-48 md:w-64"
            style={{
              top: Math.min(tooltipPosition.y + 10, window.innerHeight - 200),
              left: Math.min(tooltipPosition.x + 10, window.innerWidth - 250),
              maxWidth: '90vw'
            }}
          >
            <h3 className="font-bold text-base md:text-lg">{hoveredProject.title}</h3>
            <p className="text-xs md:text-sm text-gray-300 mb-1">
              <span className="font-medium">Kategorie:</span> {getCategoryName(hoveredProject.category)}
            </p>
            <p className="text-xs md:text-sm text-gray-300 mb-1">
              <span className="font-medium">Zeitraum:</span> {
                hoveredProject.startDate && hoveredProject.endDate ?
                  `${new Date(hoveredProject.startDate).toLocaleDateString()} - ${new Date(hoveredProject.endDate).toLocaleDateString()}` :
                  'Kein Zeitraum definiert'
              }
            </p>
            <p className="text-xs md:text-sm text-gray-300 mb-1">
              <span className="font-medium">Status:</span> {hoveredProject.status}
            </p>
            <p className="text-xs md:text-sm text-gray-300">
              {hoveredProject.description || ''}
            </p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Roadmap;