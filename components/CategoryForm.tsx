import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface CategoryFormProps {
  categoryId?: string; // If provided, we're editing an existing category
  onCancel: () => void;
}

interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

const defaultFormData: CategoryFormData = {
  name: '',
  color: '#4299E1', // Default blue color
  icon: 'Devices2',
};

// List of available icons
const availableIcons = [
  'Devices2',
  'Server',
  'ShieldSolid',
  'Database',
  'Cloud',
  'Code',
  'User',
  'Settings',
  'Document',
  'Chart',
];

const CategoryForm: React.FC<CategoryFormProps> = ({ categoryId, onCancel }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
    // Fetch category data if editing
    useEffect(() => {
      if (categoryId) {
        setLoading(true);
        setError(null);
      
        // First, check if we have any categories at all
        fetch('/api/categories')
          .then(response => response.json())
          .then(categories => {
            console.log('Available categories:', categories);
          
            // Now fetch the specific category
            return fetch(`/api/categories/${categoryId}`);
          })
          .then(response => {
            if (!response.ok) {
              if (response.status === 404) {
                throw new Error('Category not found. Please check the ID and try again.');
              }
              throw new Error(`Error fetching category: ${response.statusText}`);
            }
            return response.json();
          })
          .then(data => {
            setFormData({
              name: data.name,
              color: data.color,
              icon: data.icon,
            });
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching category:', err);
            setError('Failed to load category data: ' + err.message);
            setLoading(false);
          });
      }
    }, [categoryId]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Determine if we're creating or updating
      const url = categoryId ? `/api/categories/${categoryId}` : '/api/categories';
      const method = categoryId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
      }
      
      // Redirect to admin page on success
      router.push('/admin');
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the category');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-white">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{categoryId ? 'Edit Category' : 'Create New Category'}</h1>
        <button 
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          Abbrechen
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900 border border-red-800 text-white px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bezeichnung
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Farbe
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="h-10 w-10 rounded border border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  placeholder="#RRGGBB"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Icon
              </label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableIcons.map(icon => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              
              <div className="mt-4 grid grid-cols-5 gap-4">
                {availableIcons.map(icon => (
                  <div 
                    key={icon}
                    className={`p-3 border rounded-md cursor-pointer flex items-center justify-center ${
                      formData.icon === icon 
                        ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  >
                    <div className="text-center">
                      <div className="text-xl mb-1">{icon.replace('Icon', '').charAt(0)}</div>
                      <div className="text-xs text-gray-400 truncate">{icon}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Saving...' : categoryId ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
