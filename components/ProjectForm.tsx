import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface ProjectFormProps {
  projectId?: string; // If provided, we're editing an existing project
  onCancel: () => void;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface FieldType {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
}

interface ProjectFormData {
  title: string;
  category: string;
  startQuarter: string;
  endQuarter: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  projektleitung: string;
  bisher: string;
  zukunft: string;
  fortschritt: number;
  geplante_umsetzung: string;
  budget: string;
  teamMembers: TeamMember[];
  fields: {
    process: string[];
    technology: string[];
    services: string[];
    data: string[];
  };
}

const defaultFormData: ProjectFormData = {
  title: '',
  category: '',
  startQuarter: 'Q1',
  endQuarter: 'Q4',
  description: '',
  status: 'planned',
  projektleitung: '',
  bisher: '',
  zukunft: '',
  fortschritt: 0,
  geplante_umsetzung: '',
  budget: '',
  teamMembers: [{ name: '', role: '' }],
  fields: {
    process: [''],
    technology: [''],
    services: [''],
    data: [''],
  },
};

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onCancel }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories, field types, and project data if editing
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error(`Error fetching categories: ${categoriesResponse.statusText}`);
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Fetch field types
        const fieldTypesResponse = await fetch('/api/fieldTypes');
        if (!fieldTypesResponse.ok) {
          throw new Error(`Error fetching field types: ${fieldTypesResponse.statusText}`);
        }
        const fieldTypesData = await fieldTypesResponse.json();
        setFieldTypes(fieldTypesData);

        // If projectId is provided, fetch the project data
        if (projectId) {
          const projectResponse = await fetch(`/api/projects/${projectId}`);
          if (!projectResponse.ok) {
            throw new Error(`Error fetching project: ${projectResponse.statusText}`);
          }
          const projectData = await projectResponse.json();

          // Transform the project data to match our form structure
          setFormData({
            title: projectData.title,
            category: projectData.category,
            startQuarter: projectData.startQuarter,
            endQuarter: projectData.endQuarter,
            description: projectData.description,
            status: projectData.status,
            projektleitung: projectData.projektleitung || '',
            bisher: projectData.bisher || '',
            zukunft: projectData.zukunft || '',
            fortschritt: projectData.fortschritt || 0,
            geplante_umsetzung: projectData.geplante_umsetzung || '',
            budget: projectData.budget || '',
            teamMembers: projectData.users?.length
              ? projectData.users.map((user: any) => ({ name: user.name, role: user.role }))
              : [{ name: '', role: '' }],
            fields: {
              process: projectData.felder?.process || [''],
              technology: projectData.felder?.technology || [''],
              services: projectData.felder?.services || [''],
              data: projectData.felder?.data || [''],
            },
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamMemberChange = (index: number, field: 'name' | 'role', value: string) => {
    setFormData(prev => {
      const updatedMembers = [...prev.teamMembers];
      updatedMembers[index] = { ...updatedMembers[index], [field]: value };
      return { ...prev, teamMembers: updatedMembers };
    });
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '' }],
    }));
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => {
      const updatedMembers = [...prev.teamMembers];
      updatedMembers.splice(index, 1);
      return { ...prev, teamMembers: updatedMembers.length ? updatedMembers : [{ name: '', role: '' }] };
    });
  };

  const handleFieldChange = (fieldType: 'process' | 'technology' | 'services' | 'data', index: number, value: string) => {
    setFormData(prev => {
      const updatedFields = { ...prev.fields };
      updatedFields[fieldType] = [...updatedFields[fieldType]];
      updatedFields[fieldType][index] = value;
      return { ...prev, fields: updatedFields };
    });
  };

  const addField = (fieldType: 'process' | 'technology' | 'services' | 'data') => {
    setFormData(prev => {
      const updatedFields = { ...prev.fields };
      updatedFields[fieldType] = [...updatedFields[fieldType], ''];
      return { ...prev, fields: updatedFields };
    });
  };

  const removeField = (fieldType: 'process' | 'technology' | 'services' | 'data', index: number) => {
    setFormData(prev => {
      const updatedFields = { ...prev.fields };
      updatedFields[fieldType] = [...updatedFields[fieldType]];
      updatedFields[fieldType].splice(index, 1);
      if (updatedFields[fieldType].length === 0) {
        updatedFields[fieldType] = [''];
      }
      return { ...prev, fields: updatedFields };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Filter out empty fields
      const filteredFormData = {
        ...formData,
        teamMembers: formData.teamMembers.filter(member => member.name.trim() !== '' || member.role.trim() !== ''),
        fields: {
          process: formData.fields.process.filter(item => item.trim() !== ''),
          technology: formData.fields.technology.filter(item => item.trim() !== ''),
          services: formData.fields.services.filter(item => item.trim() !== ''),
          data: formData.fields.data.filter(item => item.trim() !== ''),
        },
      };

      // Determine if we're creating or updating
      const url = projectId ? `/api/projects/${projectId}` : '/api/projects';
      const method = projectId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filteredFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      // Redirect to admin page on success
      router.push('/admin');
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the project');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get field type information
  const getFieldTypeInfo = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.type === type.toUpperCase());
    return {
      name: fieldType?.name || type,
      description: fieldType?.description || `Enter ${type} information`
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{projectId ? 'Edit Project' : 'Create New Project'}</h1>
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
        {/* Basic Information */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Quarter
              </label>
              <select
                name="startQuarter"
                value={formData.startQuarter}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End Quarter
              </label>
              <select
                name="endQuarter"
                value={formData.endQuarter}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Progress (%)
              </label>
              <input
                type="number"
                name="fortschritt"
                value={formData.fortschritt}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Lead
              </label>
              <input
                type="text"
                name="projektleitung"
                value={formData.projektleitung}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Budget
              </label>
              <input
                type="text"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Planned Implementation
              </label>
              <input
                type="text"
                name="geplante_umsetzung"
                value={formData.geplante_umsetzung}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Progress So Far
              </label>
              <textarea
                name="bisher"
                value={formData.bisher}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Future Plans
              </label>
              <textarea
                name="zukunft"
                value={formData.zukunft}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <button
              type="button"
              onClick={addTeamMember}
              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
            >
              Add Member
            </button>
          </div>

          {formData.teamMembers.map((member, index) => (
            <div key={index} className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Role"
                  value={member.role}
                  onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTeamMember(index)}
                className="text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Process Fields */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              <h2 className="text-xl font-semibold">
                {getFieldTypeInfo('PROCESS').name}
              </h2>
              <button
                type="button"
                onClick={() => addField('process')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
              >
                Add
              </button>
            </div>

            {formData.fields.process.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={getFieldTypeInfo('PROCESS').description}
                    value={item}
                    onChange={(e) => handleFieldChange('process', index, e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeField('process', index)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Technology Fields */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              <h2 className="text-xl font-semibold">
                {getFieldTypeInfo('TECHNOLOGY').name}
              </h2>
              <button
                type="button"
                onClick={() => addField('technology')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
              >
                Add
              </button>
            </div>

            {formData.fields.technology.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={getFieldTypeInfo('TECHNOLOGY').description}
                    value={item}
                    onChange={(e) => handleFieldChange('technology', index, e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeField('technology', index)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Services Fields */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              <h2 className="text-xl font-semibold">
                {getFieldTypeInfo('SERVICE').name}
              </h2>
              <button
                type="button"
                onClick={() => addField('services')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
              >
                Add
              </button>
            </div>

            {formData.fields.services.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={getFieldTypeInfo('SERVICE').description}
                    value={item}
                    onChange={(e) => handleFieldChange('services', index, e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeField('services', index)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Data Fields */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              <h2 className="text-xl font-semibold">
                {getFieldTypeInfo('DATA').name}
              </h2>
              <button
                type="button"
                onClick={() => addField('data')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
              >
                Add
              </button>
            </div>

            {formData.fields.data.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={getFieldTypeInfo('DATA').description}
                    value={item}
                    onChange={(e) => handleFieldChange('data', index, e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeField('data', index)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
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
            {submitting ? 'Saving...' : projectId ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;