import React from 'react';
import { FaTag, FaTimes, FaFilter, FaLayerGroup } from 'react-icons/fa';

interface EnhancedSidebarProps {
  // Kategorien
  categories: Array<{ id: string; name: string; color: string; icon: string }>;
  activeCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  
  // Tags
  availableTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAllTags: () => void;
  
  // Projektstatistiken
  totalProjects: number;
  filteredProjects: number;
  
  // Projekte für Berechnungen
  projects?: Array<{ id: string; category: string; tags?: string[] }>;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  categories,
  activeCategories,
  onToggleCategory,
  availableTags,
  activeTags,
  onToggleTag,
  onClearAllTags,
  totalProjects,
  filteredProjects,
  projects = []
}) => {
  // Vordefinierte Tag-Farben
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
      'Migration': '#9333EA',
      'Automatisierung': '#16A34A',
      'Infrastruktur': '#0891B2',
      'Compliance': '#B91C1C',
      'Training': '#CA8A04'
    };
    
    return tagColors[tag] || '#6B7280';
  };

  const getCategoryProjectCount = (categoryId: string): number => {
    return projects.filter(project => project.category === categoryId).length;
  };

  const getTagProjectCount = (tag: string): number => {
    return projects.filter(project => project.tags && project.tags.includes(tag)).length;
  };

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Statistiken */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <FaFilter className="mr-2 text-yellow-500" />
            Übersicht
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Gesamt Projekte:</span>
              <span className="font-medium text-white">{totalProjects}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Gefiltert:</span>
              <span className="font-medium text-yellow-400">{filteredProjects}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Aktive Filter:</span>
              <span className="font-medium text-blue-400">
                {(categories.length - activeCategories.length) + activeTags.length}
              </span>
            </div>
          </div>
        </div>

        {/* Kategorien-Filter */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <FaLayerGroup className="mr-2 text-blue-500" />
            Bereiche
          </h3>
          <div className="space-y-2">
            {categories.map(category => {
              const isActive = activeCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => onToggleCategory(category.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center justify-between group ${
                    isActive 
                      ? 'bg-gray-700 text-white shadow-md' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-600 text-gray-300 rounded-full px-2 py-1">
                      {getCategoryProjectCount(category.id)}
                    </span>
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      isActive ? 'bg-green-500' : 'bg-gray-600 group-hover:bg-gray-500'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags-Filter */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <FaTag className="mr-2 text-purple-500" />
              Technologien
            </h3>
            {activeTags.length > 0 && (
              <button
                onClick={onClearAllTags}
                className="text-xs text-gray-400 hover:text-white flex items-center transition-colors"
                title="Alle Tags entfernen"
              >
                <FaTimes className="mr-1" />
                Löschen
              </button>
            )}
          </div>

          {availableTags.length > 0 ? (
            <div className="space-y-2">
              {availableTags.map(tag => {
                const isActive = activeTags.includes(tag);
                const tagColor = getTagColor(tag);
                
                return (
                  <button
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    className={`w-full p-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between text-sm ${
                      isActive
                        ? 'text-white shadow-md transform scale-105'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    style={isActive ? { backgroundColor: tagColor } : {}}
                  >                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: isActive ? 'white' : tagColor }}
                      />
                      <span className="font-medium">{tag}</span>
                      <span className="ml-auto text-xs bg-gray-600 text-gray-300 rounded-full px-1.5 py-0.5">
                        {getTagProjectCount(tag)}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FaTag className="mx-auto mb-2 text-2xl" />
              <p className="text-sm">Keine Tags verfügbar</p>
              <p className="text-xs mt-1">Tags werden zu Projekten hinzugefügt</p>
            </div>
          )}

          {/* Aktive Tags Anzeige */}
          {activeTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Aktive Tags:</p>
              <div className="flex flex-wrap gap-1">
                {activeTags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: getTagColor(tag) }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Schnellfilter */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Schnellfilter</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                // Alle kritischen und hohen Prioritäten
                const priorityTags = availableTags.filter(tag => 
                  ['Critical', 'High', 'RPA', 'Security'].includes(tag)
                );
                priorityTags.forEach(tag => {
                  if (!activeTags.includes(tag)) {
                    onToggleTag(tag);
                  }
                });
              }}
              className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
            >
              🔴 Hohe Priorität
            </button>
            <button
              onClick={() => {
                const techTags = availableTags.filter(tag => 
                  ['M365', 'Cloud', 'KI/AI'].includes(tag)
                );
                techTags.forEach(tag => {
                  if (!activeTags.includes(tag)) {
                    onToggleTag(tag);
                  }
                });
              }}
              className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
            >
              💻 Technologie
            </button>
            <button
              onClick={() => {
                const processTags = availableTags.filter(tag => 
                  ['RPA', 'Automatisierung', 'Integration'].includes(tag)
                );
                processTags.forEach(tag => {
                  if (!activeTags.includes(tag)) {
                    onToggleTag(tag);
                  }
                });
              }}
              className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
            >
              ⚙️ Prozesse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSidebar;
