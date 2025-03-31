import React from 'react';
import { Icon, Checkbox } from '@fluentui/react';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

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
  return (
    <div className="w-64 p-5 border-r border-gray-700 bg-gray-800">
      <h2 className="text-lg font-bold mb-5 text-white">Projekt Kategorien</h2>

      {categories.map(category => (
        <div
          key={category.id}
          className={`flex items-center mb-4 p-3 rounded-lg cursor-pointer transition-all duration-250 hover:bg-gray-700 hover:translate-x-1 ${activeCategories.includes(category.id) ? 'bg-gray-700 border-l-4 border-yellow-400 pl-2' : ''}`}
          onClick={() => onToggleCategory(category.id)}
        >
          <Icon
            iconName={category.icon}
            className="mr-3 text-xl"
            style={{ color: category.color }}
          />
          <span className="flex-1 text-white">{category.name}</span>
          <Checkbox
            checked={activeCategories.includes(category.id)}
            onChange={() => onToggleCategory(category.id)}
            className="m-0"
          />
        </div>
      ))}
    </div>
  );
};

export default CategorySidebar;