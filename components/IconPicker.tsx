import React, { useState } from 'react';
import { iconCategories, getIconByName } from '../utils/reactIcons';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  
  // Get all available icon names
  const allIconNames = Object.values(iconCategories).flat();
  
  // Filter icons based on search term
  const filteredIcons = searchTerm 
    ? allIconNames.filter(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allIconNames;
  
  // Render the selected icon or a placeholder
  const renderSelectedIcon = () => {
    if (!value) {
      return <span className="text-gray-400">Select an icon</span>;
    }
    
    const IconComponent = getIconByName(value);
    return IconComponent ? <IconComponent className="text-white" size={20} /> : <span>📁</span>;
  };
  
  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-2 p-2 border border-gray-600 rounded cursor-pointer"
        onClick={() => setShowPicker(!showPicker)}
      >
        <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
          {renderSelectedIcon()}
        </div>
        <span>{value || 'Select an icon'}</span>
      </div>
      
      {showPicker && (
        <div className="absolute z-50 mt-1 w-96 bg-gray-800 border border-gray-600 rounded shadow-lg p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search icons..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm ? (
            <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {filteredIcons.map(iconName => {
                const IconComponent = getIconByName(iconName);
                return (
                  <div
                    key={iconName}
                    className={`p-2 rounded cursor-pointer hover:bg-gray-700 flex items-center justify-center ${
                      value === iconName ? 'bg-blue-600' : ''
                    }`}
                    onClick={() => {
                      onChange(iconName);
                      setShowPicker(false);
                    }}
                    title={iconName}
                  >
                    {IconComponent ? <IconComponent className="text-white" size={20} /> : <span>?</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {Object.entries(iconCategories).map(([category, icons]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-white font-medium mb-2 capitalize">{category}</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {icons.map(iconName => {
                      const IconComponent = getIconByName(iconName);
                      return (
                        <div
                          key={iconName}
                          className={`p-2 rounded cursor-pointer hover:bg-gray-700 flex items-center justify-center ${
                            value === iconName ? 'bg-blue-600' : ''
                          }`}
                          onClick={() => {
                            onChange(iconName);
                            setShowPicker(false);
                          }}
                          title={iconName}
                        >
                          {IconComponent ? <IconComponent className="text-white" size={20} /> : <span>?</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IconPicker;