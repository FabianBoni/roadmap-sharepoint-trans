import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { Category, clientDataService } from '../utils/clientDataService';

interface CategoryFormProps {
  initialData?: Category;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, onCancel }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    color: initialData?.color || '#3B82F6', // Default blue color
    icon: initialData?.icon || '',
    parentId: initialData?.parentId || '',
    isSubcategory: initialData?.parentId ? true : false
  });

  // Fetch all categories to populate parent category dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await clientDataService.getAllCategories();
        // Filter out the current category (to prevent self-reference) and subcategories
        const availableParents = initialData?.id
          ? categories.filter(cat => cat.id !== initialData.id && !cat.isSubcategory)
          : categories.filter(cat => !cat.isSubcategory);
        setAllCategories(availableParents);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      isSubcategory: name === 'parentId' ? value !== '' : prev.isSubcategory
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData) {
        // Update existing category
        await clientDataService.updateCategory(initialData.id, formData);
        toast.success('Category updated successfully');
      } else {
        // Create new category
        await clientDataService.createCategory(formData);
        toast.success('Category created successfully');
      }
      router.push('/admin');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(initialData ? 'Failed to update category' : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">Color</label>
          <div className="flex space-x-2">
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="h-10 w-10 bg-gray-700 border border-gray-600 rounded"
            />
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="#HEX"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">Icon (Optional)</label>
          <input
            type="text"
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Icon name or URL"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Parent Category (Optional)</label>
          <select
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="">None (Top-level Category)</option>
            {allCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          disabled={loading}
        >
          {loading ? 'Saving...' : initialData ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;