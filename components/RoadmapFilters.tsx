import React, { useState } from 'react';
import { Project, Category } from '../types';
import { FaFilter, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface FilterState {
  status: string[];
  priority: string[];
  tags: string[];
  categories: string[];
  projektleitung: string[];
  fortschrittRange: [number, number];
  dateRange: { start: string; end: string };
}

interface RoadmapFiltersProps {
  projects: Project[];
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const RoadmapFilters: React.FC<RoadmapFiltersProps> = ({
  projects,
  categories,
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extrahiere alle verfügbaren Werte aus den Projekten
  const getAllStatuses = () => {
    const statuses = new Set(projects.map(p => p.status));
    return Array.from(statuses);
  };
  const getAllPriorities = () => {
    const priorities = new Set(projects.map(p => p.priority).filter(Boolean) as string[]);
    return Array.from(priorities);
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    projects.forEach(p => {
      if (p.tags) {
        p.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  };

  const getAllProjektleitung = () => {
    const projektleitung = new Set(projects.map(p => p.projektleitung).filter(Boolean));
    return Array.from(projektleitung).sort();
  };

  // Status-Labels
  const statusLabels: { [key: string]: string } = {
    'planned': 'Geplant',
    'in-progress': 'In Bearbeitung',
    'completed': 'Abgeschlossen',
    'paused': 'Pausiert',
    'cancelled': 'Abgebrochen'
  };

  // Prioritäts-Labels
  const priorityLabels: { [key: string]: string } = {
    'low': 'Niedrig',
    'medium': 'Mittel',
    'high': 'Hoch',
    'critical': 'Kritisch'
  };

  // Prioritäts-Farben
  const priorityColors: { [key: string]: string } = {
    'low': '#65A30D',
    'medium': '#D97706',
    'high': '#EA580C',
    'critical': '#DC2626'
  };

  // Tag-Farben (wie in anderen Komponenten)
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
    };
    return tagColors[tag] || '#6B7280';
  };
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'status' | 'priority' | 'tags' | 'categories' | 'projektleitung', value: string) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updateFilter(key, newValues);
  };

  const hasActiveFilters = () => {
    return filters.status.length > 0 ||
           filters.priority.length > 0 ||
           filters.tags.length > 0 ||
           filters.categories.length > 0 ||
           filters.projektleitung.length > 0 ||
           filters.fortschrittRange[0] > 0 ||
           filters.fortschrittRange[1] < 100 ||
           filters.dateRange.start ||
           filters.dateRange.end;
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      {/* Filter Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
          >
            <FaFilter />
            <span className="font-medium">Filter</span>
            {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </button>
          
          {hasActiveFilters() && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
              Aktiv
            </span>
          )}
        </div>

        {hasActiveFilters() && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <FaTimes size={12} />
            <span>Alle Filter zurücksetzen</span>
          </button>
        )}
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* Status Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Status</h4>
              <div className="space-y-1">
                {getAllStatuses().map(status => (
                  <label key={status} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => toggleArrayFilter('status', status)}
                      className="mr-2 rounded"
                    />
                    <span className="text-gray-300">{statusLabels[status] || status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priorität Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Priorität</h4>
              <div className="space-y-1">                {getAllPriorities().map(priority => (
                  <label key={priority} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority)}
                      onChange={() => toggleArrayFilter('priority', priority)}
                      className="mr-2 rounded"
                    />
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: priorityColors[priority] || '#6B7280' }}
                      />
                      <span className="text-gray-300">{priorityLabels[priority] || priority}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Kategorien Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Kategorien</h4>
              <div className="space-y-1">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.id)}
                      onChange={() => toggleArrayFilter('categories', category.id)}
                      className="mr-2 rounded"
                    />
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-gray-300">{category.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {getAllTags().map(tag => (
                  <label key={tag} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag)}
                      onChange={() => toggleArrayFilter('tags', tag)}
                      className="mr-2 rounded"
                    />
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getTagColor(tag) }}
                      />
                      <span className="text-gray-300">{tag}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Projektleitung Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Projektleitung</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {getAllProjektleitung().map(leitung => (
                  <label key={leitung} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.projektleitung.includes(leitung)}
                      onChange={() => toggleArrayFilter('projektleitung', leitung)}
                      className="mr-2 rounded"
                    />
                    <span className="text-gray-300">{leitung}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fortschritt Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Fortschritt</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{filters.fortschrittRange[0]}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.fortschrittRange[0]}
                    onChange={(e) => updateFilter('fortschrittRange', [parseInt(e.target.value), filters.fortschrittRange[1]])}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400">{filters.fortschrittRange[1]}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.fortschrittRange[1]}
                    onChange={(e) => updateFilter('fortschrittRange', [filters.fortschrittRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                </div>
                <div className="text-xs text-gray-400 text-center">
                  {filters.fortschrittRange[0]}% - {filters.fortschrittRange[1]}%
                </div>
              </div>
            </div>

            {/* Datumsbereich Filter */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Zeitraum</h4>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="flex-1 bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Von"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="flex-1 bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Bis"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapFilters;
export type { FilterState };
