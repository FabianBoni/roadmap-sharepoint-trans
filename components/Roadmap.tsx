import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RoadmapYearNavigation from './RoadmapYearNavigation';
import { Category, Project } from '../types';
import { clientDataService } from '../utils/clientDataService';
import CategorySidebar from './CategorySidebar';
import Footer from './Footer';

interface RoadmapProps {
  initialProjects: Project[];
}

const Roadmap: React.FC<RoadmapProps> = ({ initialProjects }) => {
  const router = useRouter(); // Add router for navigation
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [roadmapTitle, setRoadmapTitle] = useState<string>(`IT + Digital Roadmap ${currentYear}`);

  // Fetch categories, filter projects, and get roadmap title
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

    // Fetch roadmap title setting
    const fetchRoadmapTitle = async () => {
      try {
        const titleSetting = await clientDataService.getSettingByKey('roadmapTitle');
        if (titleSetting && titleSetting.value) {
          // Replace {year} placeholder with the current year if present
          const title = titleSetting.value.replace('{year}', currentYear.toString());
          setRoadmapTitle(title);
        } else {
          setRoadmapTitle(`IT + Digital Roadmap ${currentYear}`);
        }
      } catch (error) {
        console.error('Error fetching roadmap title:', error);
        setRoadmapTitle(`IT + Digital Roadmap ${currentYear}`);
      }
    };

    fetchCategories();
    fetchRoadmapTitle();
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

  // Handle mouse over for project tooltip
  const handleMouseOver = (e: React.MouseEvent, project: Project) => {
    setHoveredProject(project);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse leave for project tooltip
  const handleMouseLeave = () => {
    setHoveredProject(null);
  };

  // Add this function to handle clicks on projects
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <>
      <div className="min-h-screen pt-20 px-20 font-sans bg-gray-900 text-white overflow-hidden p-0 m-0">
        <header className="py-8 px-10">
          <h1 className="text-5xl font-bold m-0 uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent shadow-xl">
            {roadmapTitle}
          </h1>
        </header>

        <div className="flex justify-end p-2.5 px-10">
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
            {/* Quarter headers with gradient colors */}
            <div className="grid grid-cols-4 gap-4 mb-6">
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
            </div>

            {/* Project timeline bars */}
            <div className="space-y-4 relative">
              {filteredProjects.map(project => {
                // Calculate the position and width of the project bar
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

                // Only show projects that are visible in the current year
                if (
                  (startYearNum <= currentYear && endYearNum >= currentYear) &&
                  width > 0
                ) {
                  return (
                    <div
                      key={project.id}
                      className="relative h-12"
                    >
                      <div className="absolute top-0 left-0 right-0 grid grid-cols-4 gap-4 h-full pointer-events-none">
                        <div className="bg-gray-800 rounded-lg opacity-30"></div>
                        <div className="bg-gray-800 rounded-lg opacity-30"></div>
                        <div className="bg-gray-800 rounded-lg opacity-30"></div>
                        <div className="bg-gray-800 rounded-lg opacity-30"></div>
                      </div>

                      <div
                        className="absolute top-0 h-full rounded-lg flex items-center px-4 cursor-pointer transition-all hover:brightness-110"
                        style={{
                          left: `${startPosition}%`,
                          width: `${width}%`,
                          backgroundColor: getCategoryColor(project.category),
                          opacity: 0.8
                        }}
                        onMouseEnter={(e) => handleMouseOver(e, project)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleProjectClick(project.id)} // Add click handler here
                      >
                        <span className="font-medium truncate">{project.title}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {/* Tooltip */}
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
                    <span className="font-medium">Status:</span> {hoveredProject.status}
                  </p>
                  <p className="text-sm text-gray-300">
                    {hoveredProject.description || ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Roadmap;