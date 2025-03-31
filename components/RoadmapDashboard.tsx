import React, { useState, useEffect } from 'react';
import CategorySidebar from './CategorySidebar';
import ProjectTimeline from './ProjectTimeline';
import TimelineNavigation from './TimelineNavigation';
import Footer from './Footer';
import ClientOnly from './ClientOnly';

interface Project {
  id: string;
  title: string;
  category: string;
  startQuarter: string;
  endQuarter: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const RoadmapDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then(response => response.json())
      .then((data: Category[]) => {
        setCategories(data);
        setActiveCategories(data.map(c => c.id));
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
      });

    // Fetch projects
    fetch('/api/projects')
      .then(response => response.json())
      .then((data: Project[]) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
        setLoading(false);
      });
  }, []);

  const toggleCategory = (categoryId: string) => {
    if (activeCategories.includes(categoryId)) {
      setActiveCategories(activeCategories.filter(id => id !== categoryId));
    } else {
      setActiveCategories([...activeCategories, categoryId]);
    }
  };

  const filteredProjects = projects.filter(project =>
    activeCategories.includes(project.category)
  );

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gray-900 text-white flex items-center justify-center">
        <p>Loading roadmap data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-gray-900 text-white overflow-hidden p-0 m-0">
      <header className="py-8 px-10 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
        <h1 className="text-5xl font-bold m-0 uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent shadow-xl">
          IT + Digital Portfolio Roadmap 2025
        </h1>
      </header>

      <ClientOnly>
        <div className="flex justify-end p-2.5 px-10 border-b border-gray-700">
          {/* Fluent UI components here */}
        </div>

        <div className="flex h-[calc(100vh-200px)] border-none">
          <CategorySidebar
            categories={categories}
            activeCategories={activeCategories}
            onToggleCategory={toggleCategory}
          />
          <div className="flex-1 p-5 pr-5 overflow-y-auto">
            <TimelineNavigation />
            <ProjectTimeline
              projects={filteredProjects}
              categories={categories}
            />
          </div>
        </div>
      </ClientOnly>

      <footer className="py-5 px-10 border-t border-gray-700 text-xs text-gray-500 text-center">
        <Footer />
      </footer>
    </div>
  );
}

export default RoadmapDashboard;