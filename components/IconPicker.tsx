import React, { useState, useEffect } from 'react';
import { searchIcons, getIconSamples, getIconByName } from '../utils/reactIcons';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [samples, setSamples] = useState<Record<string, string[]>>({});
  
  // Load initial samples
  useEffect(() => {
    setSamples(getIconSamples(10));
  }, []);
  
  // Search when term changes
  useEffect(() => {
    setResults(searchIcons(searchTerm, 100));
  }, [searchTerm]);
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Icon Explorer</h2>
      
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
        <div>
          <h3 className="font-medium mb-2">Search Results ({results.length})</h3>
          <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
            {results.map(iconName => {
              const IconComponent = getIconByName(iconName);
              return (
                <div
                  key={iconName}
                  className={`p-2 rounded cursor-pointer hover:bg-gray-700 flex flex-col items-center justify-center ${
                    value === iconName ? 'bg-blue-600' : ''
                  }`}
                  onClick={() => onChange(iconName)}
                  title={iconName}
                >
                  {IconComponent ? <IconComponent className="text-white" size={20} /> : <span>?</span>}
                  <span className="text-xs mt-1 truncate w-full text-center">{iconName}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-medium mb-2">Icon Samples by Library</h3>
          {Object.entries(samples).map(([library, icons]) => (
            <div key={library} className="mb-4">
              <h4 className="text-sm font-medium mb-1 capitalize">{library} Icons</h4>
              <div className="grid grid-cols-6 gap-2">
                {icons.map(iconName => {
                  const IconComponent = getIconByName(iconName);
                  return (
                    <div
                      key={iconName}
                      className={`p-2 rounded cursor-pointer hover:bg-gray-700 flex flex-col items-center justify-center ${
                        value === iconName ? 'bg-blue-600' : ''
                      }`}
                      onClick={() => onChange(iconName)}
                      title={iconName}
                    >
                      {IconComponent ? <IconComponent className="text-white" size={20} /> : <span>?</span>}
                      <span className="text-xs mt-1 truncate w-full text-center">{iconName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IconPicker;