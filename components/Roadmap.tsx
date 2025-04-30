import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RoadmapYearNavigation from './RoadmapYearNavigation';
import { Category, Project } from '../types';
import { clientDataService } from '../utils/clientDataService';
import CategorySidebar from './CategorySidebar';
import Footer from './Footer';
import ToggleSwitch from './ToggleSwitch';

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
  const [showCalendarWeeks, setShowCalendarWeeks] = useState<boolean>(false);

  // Fetch categories and filter projects based on the selected year
  useEffect(() => {
    // Filter projects based on year
    const filteredProjects = initialProjects.filter(project => {
      const startYear = parseInt(project.startQuarter.split(' ')[1], 10);
      const endYear = parseInt(project.endQuarter.split(' ')[1], 10);

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

  // Get status color for the left border indicator
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'completed': return '#10B981'; // green-500
      case 'in-progress': return '#3B82F6'; // blue-500
      case 'planned': return '#6B7280'; // gray-500
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

  // Convert quarter to calendar weeks
  const quarterToWeeks = (quarter: string): { start: number; end: number } => {
    const q = quarter.split(' ')[0];
    switch (q) {
      case 'Q1': return { start: 1, end: 13 };
      case 'Q2': return { start: 14, end: 26 };
      case 'Q3': return { start: 27, end: 39 };
      case 'Q4': return { start: 40, end: 52 };
      default: return { start: 1, end: 52 };
    }
  };

  // Generate calendar week headers
  const generateWeekHeaders = () => {
    const weeks = [];
    for (let i = 1; i <= 52; i += 4) {
      weeks.push(
        <div
          key={`week-${i}`}
          className="p-2 text-center font-semibold text-xs"
          style={{
            background: `linear-gradient(to right, 
              ${getGradientColor(i)}, 
              ${getGradientColor(Math.min(i + 3, 52))})`
          }}
        >
          KW {i}-{Math.min(i + 3, 52)}
        </div>
      );
    }
    return weeks;
  };

  // Get gradient color based on week number
  const getGradientColor = (week: number) => {
    const colors = [
      '#eab308', // yellow-500
      '#d97706', // amber-600
      '#ea580c', // orange-600
      '#c2410c', // orange-700
      '#b91c1c'  // red-700
    ];

    const index = Math.floor((week - 1) / 13);

    return colors[index];
  };

  // Calculate project position for calendar weeks view
  const calculateWeekPosition = (project: Project) => {
    const [startQ, startYear] = project.startQuarter.split(' ');
    const [endQ, endYear] = project.endQuarter.split(' ');

    const startYearNum = parseInt(startYear, 10);
    const endYearNum = parseInt(endYear, 10);

    const startWeeks = quarterToWeeks(startQ);
    const endWeeks = quarterToWeeks(endQ);

    let startPosition = 0;
    let width = 0;

    if (startYearNum < currentYear) {
      // Project started before current year
      startPosition = 0;
    } else if (startYearNum === currentYear) {
      // Project starts in current year
      startPosition = ((startWeeks.start - 1) / 52) * 100;
    }

    if (endYearNum > currentYear) {
      // Project ends after current year
      width = 100 - startPosition;
    } else if (endYearNum === currentYear) {
      // Project ends in current year
      width = ((endWeeks.end) / 52) * 100 - startPosition;
    }

    return { startPosition, width };
  };

  // Calculate project position for quarters view
  const calculateQuarterPosition = (project: Project) => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const [startQ, startYear] = project.startQuarter.split(' ');
    const [endQ, endYear] = project.endQuarter.split(' ');

    const startQIndex = quarters.indexOf(startQ);
    const endQIndex = quarters.indexOf(endQ);
    const startYearNum = parseInt(startYear, 10);
    const endYearNum = parseInt(endYear, 10);

    let startPosition = 0;
    let width = 0;

    if (startYearNum < currentYear) {
      // Project started before current year
      startPosition = 0;
    } else if (startYearNum === currentYear) {
      // Project starts in current year
      startPosition = startQIndex * 25;
    }

    if (endYearNum > currentYear) {
      // Project ends after current year
      width = 100 - startPosition;
    } else if (endYearNum === currentYear) {
      // Project ends in current year
      width = (endQIndex + 1) * 25 - startPosition;
    }

    return { startPosition, width };
  };

  return (
    <>
      <div className="min-h-screen pt-20 px-20 font-sans bg-gray-900 text-white overflow-hidden p-0 m-0">
        <header className="py-8 px-10">
          <h1 className="text-5xl font-bold m-0 uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent shadow-xl">
            IT + Digital Roadmap {currentYear}
          </h1>
        </header>

        <div className="flex justify-between items-center p-2.5 px-10">
          <ToggleSwitch
            label={showCalendarWeeks ? "Kalenderwochen" : "Quartale"}
            isOn={showCalendarWeeks}
            onToggle={() => setShowCalendarWeeks(!showCalendarWeeks)}
          />
          <RoadmapYearNavigation
            initialYear={currentYear}
            onYearChange={setCurrentYear}
          />
        </div>

        <div className="flex">
          {/* Sidebar with categories */}
          <CategorySidebar
            categories={categories}
            activeCategories={activeCategories}
            onToggleCategory={toggleCategory}
          />

          {/* Main content area */}
          <div className="flex-1 p-6 overflow-x-auto overflow-y-auto h-[calc(100vh-180px)]">
            {/* Quarter or Week headers */}
            <div className={`grid ${showCalendarWeeks ? 'grid-cols-13 gap-1' : 'grid-cols-4 gap-4'} mb-6`}>
              {showCalendarWeeks ? (
                generateWeekHeaders()
              ) : (
                <>
                  <div
                    className="p-3 rounded-lg text-center font-semibold"
                    style={{ background: 'linear-gradient(to right, #eab308, #d97706)' }}
                  >
                    Q1 {currentYear}
                  </div>
                  <div
                    className="p-3 rounded-lg text-center font-semibold"
                    style={{ background: 'linear-gradient(to right, #d97706, #ea580c)' }}
                  >
                    Q2 {currentYear}
                  </div>
                  <div
                    className="p-3 rounded-lg text-center font-semibold"
                    style={{ background: 'linear-gradient(to right, #ea580c, #c2410c)' }}
                  >
                    Q3 {currentYear}
                  </div>
                  <div
                    className="p-3 rounded-lg text-center font-semibold"
                    style={{ background: 'linear-gradient(to right, #c2410c, #b91c1c)' }}
                  >
                    Q4 {currentYear}
                  </div>
                </>
              )}
            </div>

            {/* Project timeline bars */}
            <div className="space-y-4 relative">
              {filteredProjects.map(project => {
                // Use the helper functions instead of inline calculations
                const { startPosition, width } = showCalendarWeeks
                  ? calculateWeekPosition(project)
                  : calculateQuarterPosition(project);

                const startYearNum = parseInt(project.startQuarter.split(' ')[1], 10);
                const endYearNum = parseInt(project.endQuarter.split(' ')[1], 10);

                // Only show projects that are visible in the current year
                if (
                  (startYearNum <= currentYear && endYearNum >= currentYear) &&
                  width > 0
                ) {
                  return (
                    <div
                      key={project.id}
                      className="relative h-12 mb-2"
                    >
                      <div className="absolute top-0 left-0 right-0 grid grid-cols-4 gap-4 h-full pointer-events-none">
                        <div className="bg-gray-800 rounded-lg opacity-30"></div>
                        <div className="bg-gray-800 rounded-lg opacity-30"></div>
                        <div className="bg-gray-800 rounded-lg opacity-30"></div>
                        <div className="bg-gray-800 rounded-lg opacity-30"></div>
                      </div>

                      <div
                        className="absolute top-0 h-full rounded-lg flex items-center px-3 cursor-pointer transition-all hover:brightness-110 group border border-white border-opacity-30 hover:border-opacity-70"
                        style={{
                          left: `${startPosition}%`,
                          width: `${width}%`,
                          backgroundColor: getCategoryColor(project.category),
                          opacity: 0.85
                        }}
                        onMouseEnter={(e) => handleMouseOver(e, project)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleProjectClick(project.id)}
                      >
                        {/* Status indicator */}
                        <div
                          className="h-3 w-3 rounded-full mr-2 flex-shrink-0 border border-white border-opacity-70"
                          style={{ backgroundColor: getStatusColor(project.status) }}
                        />

                        {/* Project title with improved visibility */}
                        <span className="font-medium truncate px-2 py-0.5 rounded bg-black bg-opacity-40 text-white group-hover:bg-opacity-60 text-sm">
                          {project.title}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })}              {/* Tooltip */}
              {hoveredProject && (
                <div
                  className="fixed bg-gray-800 p-3 rounded-lg shadow-lg z-10 w-64"
                  style={{
                    top: tooltipPosition.y + 10,
                    left: tooltipPosition.x + 10
                  }}
                >
                  <h3 className="font-bold text-lg">{hoveredProject.title}</h3>
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="font-medium">Kategorie:</span> {getCategoryName(hoveredProject.category)}
                  </p>
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="font-medium">Zeitraum:</span> {hoveredProject.startQuarter} to {hoveredProject.endQuarter}
                  </p>
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="font-medium">Status:</span> {
                      hoveredProject.status === 'completed' ? 'Abgeschlossen' :
                        hoveredProject.status === 'in-progress' ? 'In Bearbeitung' :
                          'Geplant'
                    }
                  </p>
                  <p className="text-sm text-gray-300">
                    {hoveredProject.description || ''}
                  </p>
                </div>
              )}
            </div>

            {/* Status legend */}
            <div className="mt-8 flex items-center justify-end space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2" style={{ backgroundColor: getStatusColor('planned') }}></div>
                <span className="text-sm">Geplant</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2" style={{ backgroundColor: getStatusColor('in-progress') }}></div>
                <span className="text-sm">In Bearbeitung</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2" style={{ backgroundColor: getStatusColor('completed') }}></div>
                <span className="text-sm">Abgeschlossen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Roadmap;