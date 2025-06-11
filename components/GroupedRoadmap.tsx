import React from 'react';
import { Project, Category } from '../types';
import { FaUser, FaClock, FaTag, FaExternalLinkAlt } from 'react-icons/fa';

interface GroupedRoadmapProps {
  projects: Project[];
  categories: Category[];
  currentYear: number;
  viewType: 'quarters' | 'months';
  onProjectClick: (id: string) => void;
  onMouseOver: (e: React.MouseEvent, project: Project) => void;
  onMouseLeave: () => void;
}

const GroupedRoadmap: React.FC<GroupedRoadmapProps> = ({
  projects,
  categories,
  currentYear,
  viewType,
  onProjectClick,
  onMouseOver,
  onMouseLeave
}) => {
  // Tag-Farben-Funktion
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

  // Gruppiere Projekte nach Kategorien
  const groupedProjects = categories.reduce((acc, category) => {
    const categoryProjects = projects.filter(project => project.category === category.id);
    if (categoryProjects.length > 0) {
      acc[category.id] = {
        category,
        projects: categoryProjects.sort((a, b) => {
          // Sortiere nach Priorität, dann nach Startdatum
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        })
      };
    }
    return acc;
  }, {} as Record<string, { category: Category; projects: Project[] }>);

  // Berechne Projektposition für Timeline
  const calculatePosition = (project: Project) => {
    if (!project.startDate || !project.endDate) return { startPosition: 0, width: 0 };

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { startPosition: 0, width: 0 };
    }

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    let startPosition = 0;
    let width = 0;

    if (viewType === 'quarters') {
      const getQuarter = (date: Date) => Math.floor(date.getMonth() / 3) + 1;
      const startQuarter = getQuarter(startDate);
      const endQuarter = getQuarter(endDate);

      if (startYear < currentYear) {
        startPosition = 0;
      } else if (startYear === currentYear) {
        startPosition = (startQuarter - 1) * 25;
      }

      if (endYear > currentYear) {
        width = 100 - startPosition;
      } else if (endYear === currentYear) {
        width = endQuarter * 25 - startPosition;
      }
    } else {
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth();

      if (startYear < currentYear) {
        startPosition = 0;
      } else if (startYear === currentYear) {
        startPosition = (startMonth / 12) * 100;
      }

      if (endYear > currentYear) {
        width = 100 - startPosition;
      } else if (endYear === currentYear) {
        width = ((endMonth + 1) / 12) * 100 - startPosition;
      }
    }

    return { startPosition: Math.max(0, startPosition), width: Math.max(5, width) };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'in-progress': return '#3B82F6';
      case 'planned': return '#6B7280';
      case 'paused': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '🔥';
      case 'high': return '⚡';
      case 'medium': return '⭐';
      case 'low': return '💡';
      default: return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Timeline Header */}
      <div className="sticky top-0 bg-gray-900 z-10 pb-4">
        {viewType === 'quarters' ? (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[1, 2, 3, 4].map(quarter => (
              <div
                key={quarter}
                className="p-3 rounded-lg text-center font-semibold text-sm"
                style={{ 
                  background: `linear-gradient(to right, 
                    hsl(${45 - quarter * 5}, 90%, 60%), 
                    hsl(${40 - quarter * 5}, 90%, 55%)
                  )` 
                }}
              >
                Q{quarter} {currentYear}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-1 mb-4">
            {['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].map((month, index) => (
              <div
                key={month}
                className="p-2 rounded text-center font-medium text-xs"
                style={{ 
                  background: `linear-gradient(to right, 
                    hsl(${45 - index * 2}, 80%, 60%), 
                    hsl(${40 - index * 2}, 80%, 55%)
                  )` 
                }}
              >
                {month}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gruppierte Projekte nach Kategorien */}
      {Object.entries(groupedProjects).map(([categoryId, { category, projects }]) => (
        <div key={categoryId} className="mb-8">
          {/* Kategorie-Header */}
          <div className="flex items-center mb-4 pb-2 border-b border-gray-700">
            <div
              className="w-4 h-4 rounded-full mr-3"
              style={{ backgroundColor: category.color }}
            />
            <h2 className="text-xl font-bold text-white">{category.name}</h2>
            <span className="ml-2 px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
              {projects.length} Projekt{projects.length !== 1 ? 'e' : ''}
            </span>
          </div>

          {/* Projekte in dieser Kategorie */}
          <div className="space-y-3">
            {projects.map(project => {
              const { startPosition, width } = calculatePosition(project);
              
              if (width <= 0) return null;

              return (
                <div key={project.id} className="relative">
                  {/* Projekt-Timeline */}
                  <div className="relative h-16 bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
                    {/* Timeline-Hintergrund */}
                    <div className="absolute top-0 left-0 right-0 h-full">
                      {viewType === 'quarters' ? (
                        <div className="grid grid-cols-4 h-full">
                          {[1, 2, 3, 4].map(quarter => (
                            <div key={quarter} className="border-r border-gray-700 last:border-r-0" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-12 h-full">
                          {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="border-r border-gray-700 last:border-r-0" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Projekt-Bar */}
                    <div
                      className="absolute top-2 bottom-2 rounded cursor-pointer transition-all duration-200 hover:shadow-lg"
                      style={{
                        left: `${startPosition}%`,
                        width: `${width}%`,
                        backgroundColor: getStatusColor(project.status),
                        minWidth: '120px'
                      }}
                      onClick={() => onProjectClick(project.id)}
                      onMouseOver={(e) => onMouseOver(e, project)}
                      onMouseLeave={onMouseLeave}                    >
                      <div className="p-2 h-full flex items-center justify-between text-white relative">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {getPriorityIcon(project.priority) && (
                              <span className="text-sm">{getPriorityIcon(project.priority)}</span>
                            )}
                            <span className="font-medium text-sm truncate">{project.title}</span>
                          </div>
                          
                          {/* Responsive Tag-Anzeige */}
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center space-x-3 text-xs opacity-90">
                              <div className="flex items-center">
                                <FaUser className="mr-1" />
                                <span className="truncate max-w-20">{project.projektleitung}</span>
                              </div>
                              <div className="flex items-center">
                                <FaClock className="mr-1" />
                                <span>{project.fortschritt}%</span>
                              </div>
                            </div>
                            
                            {/* Tags mit intelligentem Layout */}
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex items-center ml-2">
                                {/* Bei ausreichend Platz: Tags einzeln anzeigen */}
                                <div className="hidden xl:flex items-center space-x-1">
                                  {project.tags.slice(0, 3).map(tag => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 rounded-full text-xs bg-black bg-opacity-40 border border-white border-opacity-30"
                                      style={{
                                        backgroundColor: getTagColor(tag) + '80', // 50% opacity
                                        borderColor: getTagColor(tag)
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {project.tags.length > 3 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-black bg-opacity-40 border border-white border-opacity-30">
                                      +{project.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Bei wenig Platz: Erste 2 Tags anzeigen */}
                                <div className="hidden lg:flex xl:hidden items-center space-x-1">
                                  {project.tags.slice(0, 2).map(tag => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 rounded-full text-xs bg-black bg-opacity-40"
                                      style={{ backgroundColor: getTagColor(tag) + '80' }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {project.tags.length > 2 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-black bg-opacity-40">
                                      +{project.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Bei sehr wenig Platz: Nur Tag-Symbol mit Anzahl */}
                                <div className="flex lg:hidden items-center bg-black bg-opacity-40 px-2 py-0.5 rounded-full">
                                  <FaTag className="mr-1 text-xs" />
                                  <span className="text-xs">{project.tags.length}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-2">
                          <FaExternalLinkAlt className="text-xs opacity-60" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {Object.keys(groupedProjects).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Keine Projekte für das Jahr {currentYear} gefunden.</p>
          <p className="text-sm mt-2">Versuchen Sie, die Filter anzupassen oder ein anderes Jahr zu wählen.</p>
        </div>
      )}
    </div>
  );
};

export default GroupedRoadmap;
