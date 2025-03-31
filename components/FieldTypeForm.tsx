import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { clientDataService } from '@/utils/clientDataService';

interface FieldTypeFormProps {
  fieldTypeId?: string; // If provided, we're editing an existing field type
  onCancel: () => void;
}

interface FieldTypeFormData {
  name: string;
  type: 'PROCESS' | 'TECHNOLOGY' | 'SERVICE' | 'DATA';
  description: string;
}

const defaultFormData: FieldTypeFormData = {
  name: '',
  type: 'PROCESS',
  description: '',
};

const FieldTypeForm: React.FC<FieldTypeFormProps> = ({ fieldTypeId, onCancel }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FieldTypeFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch field type data if editing
  useEffect(() => {
    if (fieldTypeId) {
      setLoading(true);
      setError(null);

      clientDataService.getFieldTypeById(fieldTypeId)
        .then(data => {
          if (!data) {
            throw new Error('Field type not found');
          }
          setFormData({
            name: data.name,
            type: data.type as 'PROCESS' | 'TECHNOLOGY' | 'SERVICE' | 'DATA',
            description: data.description,
          });
          setLoading(false);
        }).catch(err => {
          console.error('Error fetching field type:', err);
          setError('Failed to load field type data');
          setLoading(false);
        });
    }
  }, [fieldTypeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Determine if we're creating or updating
      const url = fieldTypeId ? `/api/fieldTypes/${fieldTypeId}` : '/api/fieldTypes';
      const method = fieldTypeId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save field type');
      }

      // Redirect to admin page on success
      router.push('/admin');
    } catch (err) {
      console.error('Error saving field type:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the field type');
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
        <h1 className="text-2xl font-bold">{fieldTypeId ? 'Edit Field Type' : 'Create New Field Type'}</h1>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          Cancel
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
                Field Type Name
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
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PROCESS">Process</option>
                <option value="TECHNOLOGY">Technology</option>
                <option value="SERVICE">Service</option>
                <option value="DATA">Data</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Saving...' : fieldTypeId ? 'Update Field Type' : 'Create Field Type'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FieldTypeForm;
