import React from 'react';
import { Category } from '../types';
import * as FluentIcons from '@fluentui/react-icons';

interface CategorySidebarProps {
  categories: Category[];
  activeCategories: string[];
  onToggleCategory: (categoryId: string) => void;
}

// Define a type for the FluentIcons object to help TypeScript understand its structure
type FluentIconsType = typeof FluentIcons;
type FluentIconComponent = React.FC<{ className?: string; fontSize?: number }>;

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeCategories,
  onToggleCategory
}) => {
  // Function to render the correct Fluent UI icon based on the icon name
  const renderIcon = (iconName: string) => {
    // Only proceed if we have a valid icon name
    if (!iconName) return <span>📁</span>;
    
    // Try to get the icon component from FluentIcons
    const IconComponent = FluentIcons[iconName as keyof FluentIconsType] as FluentIconComponent | undefined;
    
    // Check if we got a valid component function
    if (IconComponent && typeof IconComponent === 'function') {
      return <IconComponent className="text-white" fontSize={16} />;
    }
    
    // Fallback if icon not found
    return <span>📁</span>;
  };

  return (
    <div className="w-64 pr-6">
      <h2 className="text-xl font-bold mb-4">Projekt Kategorien</h2>
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