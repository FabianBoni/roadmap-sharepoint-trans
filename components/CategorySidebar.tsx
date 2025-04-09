import React from 'react';
import { Category } from '../types';
// Import all icons from a specific icon set (you can choose which one you prefer)
import * as Fa from 'react-icons/fa'; // Font Awesome
import * as Md from 'react-icons/md'; // Material Design
import * as Fi from 'react-icons/fi'; // Feather Icons
import * as Ai from 'react-icons/ai'; // Ant Design Icons

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