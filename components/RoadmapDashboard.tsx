import React, { useState, useEffect } from 'react';
import { clientDataService } from '../utils/clientDataService';
import ProjectTimeline from './ProjectTimeline';
import CategoryFilter from './CategoryFilter';
import ClientOnly from './ClientOnly';
import { Project, Category } from '../types';
import RoadmapYearNavigation from './RoadmapYearNavigation';
import Footer from './Footer';

const RoadmapDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesData = await clientDataService.getAllCategories();
        setCategories(categoriesData);

        // Initially set all categories as active
        setActiveCategories(categoriesData.map(c => c.id));


        // Fetch projects and ensure description is never undefined
        const projectsData = await clientDataService.getAllProjects();

        const projectsWithDescription = projectsData.map(project => ({
          ...project,
          description: project.description || ''
        }));
        setProjects(projectsWithDescription);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleCategory = (categoryId: string) => {
    // Find the category and its subcategories (if any)
    const affectedCategoryIds = [categoryId];

    // Find all subcategories (recursive function)
    const findAllSubcategories = (parentId: string) => {
      const subcats = categories.filter(cat => cat.parentId === parentId);
      subcats.forEach(subcat => {
        affectedCategoryIds.push(subcat.id);
        findAllSubcategories(subcat.id);
      });
    };

    findAllSubcategories(categoryId);

    // Toggle all affected categories
    if (activeCategories.includes(categoryId)) {
      // Remove this category and all its subcategories
      setActiveCategories(activeCategories.filter(id => !affectedCategoryIds.includes(id)));
    } else {
      // Add this category and all its subcategories
      const newActiveCategories = [...activeCategories];
      affectedCategoryIds.forEach(id => {
        if (!newActiveCategories.includes(id)) {
          newActiveCategories.push(id);
        }
      });
      setActiveCategories(newActiveCategories);
    }
  };

  // Filter projects by active categories and current year
  const filteredProjects = projects.filter(project => {
    // Check if project's category is active
    const categoryIsActive = activeCategories.includes(project.category);

    // Check if project is relevant to current year
    const startYear = parseInt(project.startQuarter.split(' ')[1], 10);
    const endYear = parseInt(project.endQuarter.split(' ')[1], 10);
    const yearIsRelevant = startYear <= currentYear && endYear >= currentYear;

    return categoryIsActive && yearIsRelevant;
  });

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gray-900 text-white flex items-center justify-center">
        <p>Loading roadmap data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen font-sans bg-gray-900 text-white overflow-hidden p-0 m-0">
        <header className="py-8 px-10 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
          <h1 className="text-5xl font-bold m-0 uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent shadow-xl">
            IT + Digital Roadmap {currentYear}
          </h1>
        </header>

        <ClientOnly>
          <div className="flex justify-end p-2.5 px-10 border-b border-gray-700">
            <RoadmapYearNavigation
              initialYear={currentYear}
              onYearChange={handleYearChange}
            />
          </div>

          <div className="flex">
            {/* Sidebar with category filters */}
            <div className="w-64 border-r border-gray-700 p-4 bg-gray-900 h-[calc(100vh-180px)] overflow-y-auto">
              <CategoryFilter
                categories={categories}
                activeCategories={activeCategories}
                onToggleCategory={toggleCategory}
              />
            </div>

            {/* Main content area */}
            <div className="flex-1 p-6 overflow-x-auto overflow-y-auto h-[calc(100vh-180px)]">
              <ProjectTimeline
                projects={filteredProjects.map(project => ({
                  ...project,
                  description: project.description || '',
                  // Ensure status is one of the accepted values
                  status: (project.status === 'completed' ||
                    project.status === 'in-progress' ||
                    project.status === 'planned')
                    ? project.status
                    : 'planned' // Default to 'planned' if status is undefined or invalid
                }))}
                categories={categories.map(category => ({
                  ...category,
                  icon: category.icon || ''
                }))}
                currentYear={currentYear}
              />
            </div>
          </div>
        </ClientOnly>
      </div>
      <footer className="py-5 px-10 border-t border-gray-700 text-xs text-gray-500 text-center">
        <Footer />
      </footer>
    </>
  );

};
export default RoadmapDashboard;