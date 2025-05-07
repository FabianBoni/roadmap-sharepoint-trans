import React, { useState } from 'react';
import { Category } from '../types';
import * as Fa from 'react-icons/fa';
import * as Md from 'react-icons/md';
import * as Fi from 'react-icons/fi';
import * as Ai from 'react-icons/ai';

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
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Function to render the correct React Icon based on the icon name
  const renderIcon = (iconName: string) => {
    if (!iconName) {
      return <span>📁</span>;
    }
    
    // Check different icon libraries
    // Format: library prefix + icon name (e.g., "FaFolder", "MdHome")
    const iconLibrary = iconName.substring(0, 2).toLowerCase();
    
    // Choose the appropriate icon library based on prefix
    switch (iconLibrary) {
      case 'fa':
        const FaIcon = Fa[iconName as keyof typeof Fa];
        return FaIcon ? <FaIcon className="text-white" size={16} /> : <span>📁</span>;
      
      case 'md':
        const MdIcon = Md[iconName as keyof typeof Md];
        return MdIcon ? <MdIcon className="text-white" size={16} /> : <span>📁</span>;
      
      case 'fi':
        const FiIcon = Fi[iconName as keyof typeof Fi];
        return FiIcon ? <FiIcon className="text-white" size={16} /> : <span>📁</span>;
      
      case 'ai':
        const AiIcon = Ai[iconName as keyof typeof Ai];
        return AiIcon ? <AiIcon className="text-white" size={16} /> : <span>📁</span>;
      
      default:
        // Try Font Awesome as default
        const DefaultIcon = Fa[iconName as keyof typeof Fa];
        return DefaultIcon ? <DefaultIcon className="text-white" size={16} /> : <span>📁</span>;
    }
  };

  return (
    <div className="w-full lg:w-64 lg:pr-6">
      {/* Mobile toggle button */}
      <div className="flex justify-between items-center mb-2 lg:mb-4">
        <h2 className="text-xl font-bold">Bereiche</h2>
        <button 
          className="lg:hidden bg-gray-700 p-2 rounded-md"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <Fa.FaChevronDown className="text-white" />
          ) : (
            <Fa.FaChevronUp className="text-white" />
          )}
        </button>
      </div>
      
      {/* Categories list - hidden on mobile when collapsed */}
      <div className={`space-y-2 ${isCollapsed ? 'hidden lg:block' : 'block'}`}>
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
              className="w-6 h-6 md:w-8 md:h-8 rounded flex items-center justify-center mr-2 md:mr-3"
              style={{ backgroundColor: category.color }}
            >
              {renderIcon(category.icon || '')}
            </div>
            <span className="text-sm md:text-base">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySidebar;