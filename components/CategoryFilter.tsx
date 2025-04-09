import React from 'react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  activeCategories: string[];
  onToggleCategory: (categoryId: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  activeCategories, 
  onToggleCategory 
}) => {
  // Group categories by parent ID
  const topLevelCategories = categories.filter(cat => !cat.parentId);
  const subcategoriesByParent: Record<string, Category[]> = {};
  
  categories
    .filter(cat => cat.parentId)
    .forEach(subcat => {
      if (!subcategoriesByParent[subcat.parentId!]) {
        subcategoriesByParent[subcat.parentId!] = [];
      }
      subcategoriesByParent[subcat.parentId!].push(subcat);
    });

  // Render a category with its subcategories
  const renderCategory = (category: Category, level: number = 0) => {
    const subcategories = subcategoriesByParent[category.id] || [];
    const isActive = activeCategories.includes(category.id);
    
    return (
      <div key={category.id} className="mb-2">
        <div 
          className={`flex items-center p-2 rounded-md cursor-pointer ${
            isActive ? 'bg-gray-700' : 'hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onToggleCategory(category.id)}
        >
          <div 
            className="w-4 h-4 rounded-full mr-2" 
            style={{ backgroundColor: category.color }}
          ></div>
          <span className="text-sm">{category.name}</span>
          <span className="ml-auto text-xs text-gray-400">
            {subcategories.length > 0 && `(${subcategories.length})`}
          </span>
        </div>
        
        {/* Render subcategories */}
        {subcategories.map(subcat => renderCategory(subcat, level + 1))}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Categories</h3>
      <div className="space-y-1">
        {topLevelCategories.map(category => renderCategory(category))}
      </div>
    </div>
  );
};

export default CategoryFilter;