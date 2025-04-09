import React, { useState, useEffect } from 'react';
import RoadmapYearNavigation from './RoadmapYearNavigation';
import { Category } from '../types';
import { clientDataService } from '../utils/clientDataService';

interface Project {
  id: string;
  title: string;
  category: string;
  startQuarter: string;
  endQuarter: string;
  // other project properties
}

interface RoadmapProps {
  initialProjects: Project[];
}

const Roadmap: React.FC<RoadmapProps> = ({ initialProjects }) => {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); 
  
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
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, [currentYear, initialProjects]);

  // Helper function to get category name and color by ID
  const getCategoryInfo = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return {
      name: category?.name || 'Uncategorized',
      color: category?.color || '#999999'
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Roadmap JSD</h1>
          <RoadmapYearNavigation 
            initialYear={currentYear}
            onYearChange={setCurrentYear}
          />
        </header>
        
        <div className="grid grid-cols-4 gap-4">
          {/* Q1 column */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Q1 {currentYear}</h3>
            <div className="space-y-3">
              {displayedProjects
                .filter(p => p.startQuarter === `Q1 ${currentYear}` || p.endQuarter === `Q1 ${currentYear}`)
                .map(project => {
                  const categoryInfo = getCategoryInfo(project.category);
                  return (
                    <div key={project.id} className="bg-gray-700 p-3 rounded">
                      <p className="font-medium">{project.title}</p>
                      <div 
                        className="text-xs mt-1 px-2 py-1 rounded-full inline-block"
                        style={{ 
                          backgroundColor: categoryInfo.color,
                          color: '#fff'
                        }}
                      >
                        {categoryInfo.name}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Q2 column */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Q2 {currentYear}</h3>
            <div className="space-y-3">
              {displayedProjects
                .filter(p => p.startQuarter === `Q2 ${currentYear}` || p.endQuarter === `Q2 ${currentYear}`)
                .map(project => {
                  const categoryInfo = getCategoryInfo(project.category);
                  return (
                    <div key={project.id} className="bg-gray-700 p-3 rounded">
                      <p className="font-medium">{project.title}</p>
                      <div 
                        className="text-xs mt-1 px-2 py-1 rounded-full inline-block"
                        style={{ 
                          backgroundColor: categoryInfo.color,
                          color: '#fff'
                        }}
                      >
                        {categoryInfo.name}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Q3 column */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Q3 {currentYear}</h3>
            <div className="space-y-3">
              {displayedProjects
                .filter(p => p.startQuarter === `Q3 ${currentYear}` || p.endQuarter === `Q3 ${currentYear}`)
                .map(project => {
                  const categoryInfo = getCategoryInfo(project.category);
                  return (
                    <div key={project.id} className="bg-gray-700 p-3 rounded">
                      <p className="font-medium">{project.title}</p>
                      <div 
                        className="text-xs mt-1 px-2 py-1 rounded-full inline-block"
                        style={{ 
                          backgroundColor: categoryInfo.color,
                          color: '#fff'
                        }}
                      >
                        {categoryInfo.name}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Q4 column */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Q4 {currentYear}</h3>
            <div className="space-y-3">
              {displayedProjects
                .filter(p => p.startQuarter === `Q4 ${currentYear}` || p.endQuarter === `Q4 ${currentYear}`)
                .map(project => {
                  const categoryInfo = getCategoryInfo(project.category);
                  return (
                    <div key={project.id} className="bg-gray-700 p-3 rounded">
                      <p className="font-medium">{project.title}</p>
                      <div 
                        className="text-xs mt-1 px-2 py-1 rounded-full inline-block"
                        style={{ 
                          backgroundColor: categoryInfo.color,
                          color: '#fff'
                        }}
                      >
                        {categoryInfo.name}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;