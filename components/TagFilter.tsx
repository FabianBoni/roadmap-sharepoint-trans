import React from 'react';
import { FaTag, FaTimes } from 'react-icons/fa';

interface TagFilterProps {
  availableTags: string[];
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  onClearTags: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  activeTags,
  onTagToggle,
  onClearTags
}) => {
  // Vordefinierte Tag-Farben für bessere Visualisierung
  const getTagColor = (tag: string): string => {
    const tagColors: { [key: string]: string } = {
      'RPA': '#6366F1', // Indigo
      'M365': '#0F766E', // Teal
      'Lifecycle': '#7C3AED', // Violet
      'Bauprojekt': '#DC2626', // Red
      'KI/AI': '#059669', // Emerald
      'Cloud': '#2563EB', // Blue
      'Security': '#DC2626', // Red
      'Integration': '#EA580C', // Orange
      'Mobile': '#7C2D12', // Brown
      'Analytics': '#1F2937', // Gray
    };
    
    return tagColors[tag] || '#6B7280'; // Default gray
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <FaTag className="mr-2 text-gray-500" />
          Technologie-Filter
        </h3>
        {activeTags.length > 0 && (
          <button
            onClick={onClearTags}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          >
            <FaTimes className="mr-1" />
            Alle entfernen
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => {
          const isActive = activeTags.includes(tag);
          const tagColor = getTagColor(tag);
          
          return (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={isActive ? { backgroundColor: tagColor } : {}}
            >
              {tag}
            </button>
          );
        })}
      </div>
      
      {activeTags.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">
            {activeTags.length} von {availableTags.length} Tags aktiv
          </p>
        </div>
      )}
    </div>
  );
};

export default TagFilter;
