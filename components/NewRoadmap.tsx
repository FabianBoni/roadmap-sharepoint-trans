import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import RoadmapYearNavigation from './RoadmapYearNavigation';
import { Category, Project } from '../types';
import { clientDataService } from '../utils/clientDataService';
import Footer from './Footer';
import EnhancedSidebar from './EnhancedSidebar';
import GroupedRoadmap from './GroupedRoadmap';
import { FaBars, FaTimes, FaCompressArrowsAlt } from 'react-icons/fa';
import Nav from './Nav';

interface RoadmapProps {
  initialProjects: Project[];
}

const NewRoadmap: React.FC<RoadmapProps> = ({ initialProjects }) => {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [viewType, setViewType] = useState<'quarters' | 'months'>('quarters');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [siteTitle, setSiteTitle] = useState('IT + Digital Roadmap');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [compactMode, setCompactMode] = useState(true);

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setMobileSidebarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load site title
  useEffect(() => {
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

  // Helper function to extract year from ISO date string
  const getYearFromISOString = (isoString: string): number => {
    const date = new Date(isoString);
    return !isNaN(date.getTime()) ? date.getFullYear() : currentYear;
  };

  // Filter projects based on year and fetch categories
  useEffect(() => {
    const filteredProjects = initialProjects.filter(project => {
      if (!project.startDate || !project.endDate) {
        return false;
      }

      const startYear = getYearFromISOString(project.startDate);
      const endYear = getYearFromISOString(project.endDate);

      return startYear <= currentYear && endYear >= currentYear;
    });

    setDisplayedProjects(filteredProjects);

    const fetchCategories = async () => {
      try {
        const categoriesData = await clientDataService.getAllCategories();
        setCategories(categoriesData);
        setActiveCategories(categoriesData.map(c => c.id));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };    fetchCategories();
  }, [currentYear, initialProjects, getYearFromISOString]);

  // Tag management functions
  const getAllAvailableTags = (): string[] => {
    const allTags = new Set<string>();
    displayedProjects.forEach(project => {
      if (project.tags) {
        project.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  };

  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };

  const clearAllTags = () => {
    setActiveTags([]);
  };

  const toggleCategory = (categoryId: string) => {
    if (activeCategories.includes(categoryId)) {
      setActiveCategories(activeCategories.filter(id => id !== categoryId));
    } else {
      setActiveCategories([...activeCategories, categoryId]);
    }
  };

  // Main filtering logic
  const getFilteredProjects = (): Project[] => {
    let filtered = displayedProjects;

    // Filter by categories
    filtered = filtered.filter(project => activeCategories.includes(project.category));

    // Filter by tags if any are selected
    if (activeTags.length > 0) {
      filtered = filtered.filter(project => 
        project.tags && project.tags.some(tag => activeTags.includes(tag))
      );
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();
  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  // Handle mouse events
  const handleMouseOver = (e: React.MouseEvent, project: Project) => {
    setHoveredProject(project);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredProject(null);
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Top Navigation */}
        <header className="bg-gray-900 border-b border-gray-700 px-4 py-4">
          <div className="max-w-full mx-auto flex justify-between items-center">
            <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              {siteTitle}
            </h1>
            <Nav currentPage="roadmap" />
          </div>
        </header>

        {/* Main Controls */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
          <div className="max-w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            {/* View Type Controls */}
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'quarters' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setViewType('quarters')}
              >
                Quartale
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'months' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setViewType('months')}
              >
                Monate
              </button>
              <button
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  compactMode 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setCompactMode(!compactMode)}
                title="Kompakte Ansicht"
              >
                <FaCompressArrowsAlt />
              </button>
            </div>

            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                {mobileSidebarOpen ? <FaTimes /> : <FaBars />}
                <span className="ml-2">Filter</span>
              </button>
            </div>

            {/* Year Navigation */}
            <RoadmapYearNavigation
              initialYear={currentYear}
              onYearChange={setCurrentYear}
            />
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex">
          {/* Sidebar */}
          <div
            ref={sidebarRef}
            className={`fixed md:relative z-30 ${
              mobileSidebarOpen ? 'block' : 'hidden'
            } md:block`}
          >            <EnhancedSidebar
              categories={categories}
              activeCategories={activeCategories}
              onToggleCategory={toggleCategory}
              availableTags={getAllAvailableTags()}
              activeTags={activeTags}
              onToggleTag={toggleTag}
              onClearAllTags={clearAllTags}
              totalProjects={displayedProjects.length}
              filteredProjects={filteredProjects.length}
              projects={displayedProjects}
            />
          </div>

          {/* Mobile Overlay */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6 overflow-hidden">
            <GroupedRoadmap
              projects={filteredProjects}
              categories={categories}
              currentYear={currentYear}
              viewType={viewType}
              onProjectClick={handleProjectClick}
              onMouseOver={handleMouseOver}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </div>

        {/* Tooltip */}
        {hoveredProject && (
          <div
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl max-w-sm"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: 'translateY(-100%)'
            }}
          >
            <h3 className="font-bold text-white mb-2">{hoveredProject.title}</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong>Kategorie:</strong> {getCategoryName(hoveredProject.category)}</p>
              <p><strong>Status:</strong> {hoveredProject.status}</p>
              <p><strong>Fortschritt:</strong> {hoveredProject.fortschritt}%</p>
              <p><strong>Leitung:</strong> {hoveredProject.projektleitung}</p>
              {hoveredProject.tags && hoveredProject.tags.length > 0 && (
                <p><strong>Tags:</strong> {hoveredProject.tags.join(', ')}</p>
              )}
              {hoveredProject.priority && (
                <p><strong>Priorität:</strong> {hoveredProject.priority}</p>
              )}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

export default NewRoadmap;
