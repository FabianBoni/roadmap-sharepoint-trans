import React, { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  
  const predefinedColors = [
    '#4299e1', // blue
    '#9f7aea', // purple
    '#f56565', // red
    '#48bb78', // green
    '#ed8936', // orange
    '#ecc94b', // yellow
    '#38b2ac', // teal
    '#f687b3', // pink
    '#a0aec0', // gray
  ];
  
  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-2 p-2 border border-gray-600 rounded cursor-pointer"
        onClick={() => setShowPicker(!showPicker)}
      >
        <div 
          className="w-8 h-8 rounded"
          style={{ backgroundColor: value }}
        />
        <span>{value}</span>
      </div>
      
      {showPicker && (
        <div className="absolute z-50 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg p-4">
          <div className="grid grid-cols-3 gap-2">
            {predefinedColors.map(color => (
              <div
                key={color}
                className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setShowPicker(false);
                }}
              />
            ))}
          </div>
          
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">
              Custom Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 p-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="#RRGGBB"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              />
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
              onClick={() => setShowPicker(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
