import React, { useState, useEffect } from 'react';
import RoadmapYearNavigation from './RoadmapYearNavigation';
import { Category, Project } from '../types';
import { clientDataService } from '../utils/clientDataService';
import Footer from './Footer';
import CategorySidebar from './CategorySidebar';

interface RoadmapProps {
  initialProjects: Project[];
}

const Roadmap: React.FC<RoadmapProps> = ({ initialProjects }) => {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

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

  // Calculate quarter span for timeline visualization
  const getQuarterSpan = (startQ: string, endQ: string) => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const startIdx = quarters.indexOf(startQ.split(' ')[0]);
    const endIdx = quarters.indexOf(endQ.split(' ')[0]);

    return {
      start: startIdx,
      span: endIdx - startIdx + 1
    };
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-5xl font-bold mb-4 uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              IT + Digital Roadmap {currentYear}
            </h1>
            <RoadmapYearNavigation
              initialYear={currentYear}
              onYearChange={setCurrentYear}
            />
          </header>

          <div className="flex">
            <CategorySidebar
              categories={categories}
              activeCategories={activeCategories}
              onToggleCategory={toggleCategory}
            />

            {/* Main timeline area */}
            <div className="flex-1">
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
                  const { start, span } = getQuarterSpan(project.startQuarter, project.endQuarter);
                  return (
                    <div
                      key={project.id}
                      className="relative h-12"
                      onMouseEnter={() => setHoveredProject(project)}
                      onMouseLeave={() => setHoveredProject(null)}
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
                          left: `${(start * 25) + 0.5}%`,
                          width: `${span * 25 - 1}%`,
                          backgroundColor: getCategoryColor(project.category),
                          opacity: 0.8
                        }}
                      >
                        <span className="font-medium truncate">{project.title}</span>
                      </div>

                      {/* Tooltip */}
                      {hoveredProject?.id === project.id && (
                        <div className="absolute top-full mt-2 left-0 bg-gray-800 p-3 rounded-lg shadow-lg z-10 w-64">
                          <h3 className="font-bold text-lg">{project.title}</h3>
                          <p className="text-sm text-gray-300 mb-1">
                            <span className="font-medium">Kategorie:</span> {getCategoryName(project.category)}
                          </p>
                          <p className="text-sm text-gray-300 mb-1">
                            <span className="font-medium">Zeitraum:</span> {project.startQuarter} to {project.endQuarter}
                          </p>
                          <p className="text-sm text-gray-300 mb-1">
                            <span className="font-medium">Status:</span> {project.status}
                          </p>
                          <p className="text-sm text-gray-300">
                            {project.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
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