import React from 'react';
import { FaFolderOpen, FaTag, FaSortAmountDown, FaCompressArrowsAlt } from 'react-icons/fa';

interface ViewControlsProps {
  viewMode: 'category' | 'technology';
  onViewModeChange: (mode: 'category' | 'technology') => void;
  sortBy: 'priority' | 'status' | 'startDate' | 'title';
  onSortChange: (sort: 'priority' | 'status' | 'startDate' | 'title') => void;
  compactMode: boolean;
  onCompactModeToggle: () => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  compactMode,
  onCompactModeToggle
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ansichtsmodus */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Ansicht
          </label>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => onViewModeChange('category')}
              className={`px-3 py-2 text-xs font-medium rounded-l-md border ${
                viewMode === 'category'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FaFolderOpen className="inline mr-1" />
              Bereiche
            </button>
            <button
              onClick={() => onViewModeChange('technology')}
              className={`px-3 py-2 text-xs font-medium rounded-r-md border-l-0 border ${
                viewMode === 'technology'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FaTag className="inline mr-1" />
              Technologien
            </button>
          </div>
        </div>

        {/* Sortierung */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            <FaSortAmountDown className="inline mr-1" />
            Sortierung
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="priority">Priorität</option>
            <option value="status">Status</option>
            <option value="startDate">Startdatum</option>
            <option value="title">Titel</option>
          </select>
        </div>

        {/* Darstellungsmodus */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Darstellung
          </label>
          <button
            onClick={onCompactModeToggle}
            className={`w-full px-3 py-2 text-xs font-medium rounded-md border ${
              compactMode
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaCompressArrowsAlt className="inline mr-1" />
            {compactMode ? 'Kompakt aktiv' : 'Standard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewControls;
