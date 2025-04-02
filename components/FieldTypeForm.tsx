import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { FieldType, clientDataService } from '@/utils/clientDataService';
import { toast } from 'react-toastify';

interface FieldTypeFormProps {
  initialData?: FieldType;
  onCancel: () => void;
}

const FieldTypeForm: React.FC<FieldTypeFormProps> = ({ initialData, onCancel }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<FieldType, 'id'>>({
    name: initialData?.name || '',
    type: initialData?.type || '',
    description: initialData?.description || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData) {
        // Update existing field type using clientDataService
        await clientDataService.updateFieldType(initialData.id, formData);
        toast.success('Field type updated successfully');
      } else {
        // Create new field type using clientDataService
        await clientDataService.createFieldType(formData);
        toast.success('Field type created successfully');
      }
      router.push('/admin');
    } catch (error) {
      console.error('Error saving field type:', error);
      toast.error(initialData ? 'Failed to update field type' : 'Failed to create field type');
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
          <label className="block text-gray-300 mb-2">Type</label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="e.g., PROCESS, TECHNOLOGY, SERVICE, DATA"
            required
          />
          <p className="text-gray-400 text-sm mt-1">
            Use uppercase for type identifiers (e.g., PROCESS, TECHNOLOGY)
          </p>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-gray-300 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            rows={3}
          />
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
          {loading ? 'Saving...' : initialData ? 'Update Field Type' : 'Create Field Type'}
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

export default FieldTypeForm;