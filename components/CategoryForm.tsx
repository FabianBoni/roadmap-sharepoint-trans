import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Category, clientDataService } from '@/utils/clientDataService';
import { toast } from 'react-toastify';

interface CategoryFormProps {
  initialData?: Category;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, onCancel }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: initialData?.name || '',
    color: initialData?.color || '#3B82F6',
    icon: initialData?.icon || 'cube'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData) {
        // Update existing category using clientDataService
        await clientDataService.updateCategory(initialData.id, formData);
        toast.success('Category updated successfully');
      } else {
        // Create new category using clientDataService
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
          <label className="block text-gray-300 mb-2">Icon</label>
          <input
            type="text"
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Icon name (e.g., 'cube', 'chart-bar')"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">Color</label>
          <div className="flex items-center">
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="p-1 h-10 bg-gray-700 border border-gray-600 rounded mr-2"
            />
            <span className="text-white">{formData.color}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Saving...' : initialData ? 'Update Category' : 'Create Category'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;