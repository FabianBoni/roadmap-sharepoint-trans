import React from 'react';
import { Category } from '../types';
import { getIconByName } from '../utils/reactIcons';

interface CategorySidebarProps {
  categories: Category[];
  activeCategories: string[];
  onToggleCategory: (categoryId: string) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeCategories,
  onToggleCategory
}) => {
  // Function to render the correct React Icon based on the icon name
  const renderIcon = (iconName: string) => {
    if (!iconName) {
      return <span>📁</span>;
    }
    
    const IconComponent = getIconByName(iconName);
    return IconComponent ? 
      <IconComponent className="text-white" width="16" height="16" /> : 
      <span>📁</span>;
  };

  return (
    <div className="w-64 pr-6">
      <h2 className="text-xl font-bold mb-4">Bereiche</h2>
      <div className="space-y-2">
        {categories.map(category => (
          <div
            key={category.id}
            className={`flex items-center p-2 rounded cursor-pointer transition-all ${
              activeCategories.includes(category.id) 
                ? 'bg-gray-700 border-l-4' 
                : 'bg-gray-800 opacity-70'
            }`}
            style={{
              borderLeftColor: activeCategories.includes(category.id) ? category.color : 'transparent'
            }}
            onClick={() => onToggleCategory(category.id)}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center mr-3"
              style={{ backgroundColor: category.color }}
            >
              {renderIcon(category.icon || '')}
            </div>
            <span>{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySidebar;