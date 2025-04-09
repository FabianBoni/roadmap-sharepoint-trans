import React, { useState } from 'react';
import { Category } from '../types';
import { clientDataService } from '../utils/clientDataService';
import IconPicker from './IconPicker';
import ColorPicker from './ColorPicker';

interface CategoryFormProps {
  category?: Category;
  onSave: () => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || '#4299e1');
  const [icon, setIcon] = useState(category?.icon || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (category?.id) {
        // Update existing category
        await clientDataService.updateCategory(category.id, {
          name,
          color,
          icon
        });
      } else {
        // Create new category
        await clientDataService.createCategory({
          name,
          color,
          icon
        });
      }

      onSave();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">
        {category ? 'Edit Category' : 'Add New Category'}
      </h2>

      {error && (
        <div className="bg-red-900 text-white p-2 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Category Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          placeholder="Enter category name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Color
        </label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Icon
        </label>
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Category'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;