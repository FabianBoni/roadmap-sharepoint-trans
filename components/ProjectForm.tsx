import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Project, Category, clientDataService } from '@/utils/clientDataService';
import { toast } from 'react-toastify';

interface ProjectFormProps {
  projectId?: string;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onCancel }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingData, setFetchingData] = useState(projectId ? true : false);
  const [formData, setFormData] = useState<Partial<Project> & {
    teamMembers: { name: string; role: string }[];
    fields: {
      process: string[];
      technology: string[];
      services: string[];
      data: string[];
    }
  }>({
    title: '',
    category: '',
    startQuarter: 'Q1 2023',
    endQuarter: 'Q4 2023',
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
      data: ['']
    }
  });

  const fetchProject = useCallback(async (id: string) => {
    try {
      setFetchingData(true);

      // Use clientDataService directly to fetch project
      const project = await clientDataService.getProjectById(id);

      if (!project) {
        toast.error('Project not found');
        router.push('/admin');
        return;
      }

      // Use clientDataService directly to fetch team members
      const teamMembers = await clientDataService.getTeamMembersByProjectId(id);

      // Use clientDataService directly to fetch fields
      const fields = await clientDataService.getFieldsByProjectId(id);

      // Process fields by type
      const processFields = fields.filter(f => f.type === 'PROCESS').map(f => f.value);
      const technologyFields = fields.filter(f => f.type === 'TECHNOLOGY').map(f => f.value);
      const serviceFields = fields.filter(f => f.type === 'SERVICE').map(f => f.value);
      const dataFields = fields.filter(f => f.type === 'DATA').map(f => f.value);

      // Ensure at least one empty field for each type
      if (processFields.length === 0) processFields.push('');
      if (technologyFields.length === 0) technologyFields.push('');
      if (serviceFields.length === 0) serviceFields.push('');
      if (dataFields.length === 0) dataFields.push('');

      // Format team members
      const formattedTeamMembers = teamMembers.map(tm => ({
        name: tm.name,
        role: tm.role
      }));

      // Ensure at least one empty team member
      if (formattedTeamMembers.length === 0) {
        formattedTeamMembers.push({ name: '', role: '' });
      }

      setFormData({
        ...project,
        teamMembers: formattedTeamMembers,
        fields: {
          process: processFields,
          technology: technologyFields,
          services: serviceFields,
          data: dataFields
        }
      });
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setFetchingData(false);
    }
  }, [router]);

  const fetchCategories = useCallback(async () => {
    try {
      // Use clientDataService directly
      const data = await clientDataService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  }, []);

  useEffect(() => {
    // Initial fetch of categories
    fetchCategories();

    // If we have a projectId, fetch the project data
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId, fetchCategories, fetchProject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamMemberChange = (index: number, field: 'name' | 'role', value: string) => {
    setFormData(prev => {
      const newTeamMembers = [...prev.teamMembers];
      newTeamMembers[index] = { ...newTeamMembers[index], [field]: value };
      return { ...prev, teamMembers: newTeamMembers };
    });
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '' }]
    }));
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => {
      const newTeamMembers = [...prev.teamMembers];
      newTeamMembers.splice(index, 1);
      return { ...prev, teamMembers: newTeamMembers.length ? newTeamMembers : [{ name: '', role: '' }] };
    });
  };

  const handleFieldChange = (type: 'process' | 'technology' | 'services' | 'data', index: number, value: string) => {
    setFormData(prev => {
      const newFields = { ...prev.fields };
      newFields[type][index] = value;
      return { ...prev, fields: newFields };
    });
  };

  const addField = (type: 'process' | 'technology' | 'services' | 'data') => {
    setFormData(prev => {
      const newFields = { ...prev.fields };
      newFields[type] = [...newFields[type], ''];
      return { ...prev, fields: newFields };
    });
  };

  const removeField = (type: 'process' | 'technology' | 'services' | 'data', index: number) => {
    setFormData(prev => {
      const newFields = { ...prev.fields };
      newFields[type].splice(index, 1);
      if (newFields[type].length === 0) {
        newFields[type] = [''];
      }
      return { ...prev, fields: newFields };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty team members and fields
      const filteredTeamMembers = formData.teamMembers.filter(tm => tm.name && tm.role);
      const filteredFields = {
        process: formData.fields.process.filter(f => f),
        technology: formData.fields.technology.filter(f => f),
        services: formData.fields.services.filter(f => f),
        data: formData.fields.data.filter(f => f)
      };

      const projectData = {
        title: formData.title || '',
        category: formData.category || '',
        startQuarter: formData.startQuarter || '',
        endQuarter: formData.endQuarter || '',
        description: formData.description || '',
        status: (formData.status as 'planned' | 'in-progress' | 'completed') || 'planned',
        projektleitung: formData.projektleitung || '',
        bisher: formData.bisher || '',
        zukunft: formData.zukunft || '',
        fortschritt: formData.fortschritt || 0,
        geplante_umsetzung: formData.geplante_umsetzung || '',
        budget: formData.budget || '',
        teamMembers: filteredTeamMembers,
        fields: filteredFields
      };

      if (projectId) {
        // Update existing project using clientDataService
        await clientDataService.updateProject(projectId, projectData);
        toast.success('Project updated successfully');
      } else {
        // Create new project using clientDataService
        await clientDataService.createProject(projectData as Omit<Project, 'id'> & {
          teamMembers?: { name: string; role: string }[];
          fields?: {
            process: string[];
            technology: string[];
            services: string[];
            data: string[];
          }
        });
        toast.success('Project created successfully');
      }
      router.push('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(projectId ? 'Failed to update project' : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading project data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2">Project Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            required
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
          <label className="block text-gray-300 mb-2">Start Quarter</label>
          <input
            type="text"
            name="startQuarter"
            value={formData.startQuarter}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="e.g., Q1 2023"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">End Quarter</label>
          <input
            type="text"
            name="endQuarter"
            value={formData.endQuarter}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="e.g., Q4 2023"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            required
          >
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Project Lead</label>
          <input
            type="text"
            name="projektleitung"
            value={formData.projektleitung}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
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

        <div className="md:col-span-2">
          <label className="block text-gray-300 mb-2">Previous Work</label>
          <textarea
            name="bisher"
            value={formData.bisher}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-300 mb-2">Future Plans</label>
          <textarea
            name="zukunft"
            value={formData.zukunft}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Progress (%)</label>
          <input
            type="number"
            name="fortschritt"
            value={formData.fortschritt}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Planned Implementation</label>
          <input
            type="text"
            name="geplante_umsetzung"
            value={formData.geplante_umsetzung}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Budget</label>
          <input
            type="text"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Team Members</h3>
        {formData.teamMembers.map((member, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-700 rounded">
            <div>
              <label className="block text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={member.name}
                onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
              />
            </div>
            <div className="flex items-end">
              <div className="flex-grow">
                <label className="block text-gray-300 mb-2">Role</label>
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                  className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTeamMember(index)}
                className="ml-2 mb-1 p-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTeamMember}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Team Member
        </button>
      </div>

      {/* Custom Fields Section */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Custom Fields</h3>

        {/* Process Fields */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">Process</h4>
          {formData.fields.process.map((field, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                value={field}
                onChange={(e) => handleFieldChange('process', index, e.target.value)}
                className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Process name"
              />
              <button
                type="button"
                onClick={() => removeField('process', index)}
                className="ml-2 p-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addField('process')}
            className="mt-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add Process
          </button>
        </div>

        {/* Technology Fields */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">Technology</h4>
          {formData.fields.technology.map((field, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                value={field}
                onChange={(e) => handleFieldChange('technology', index, e.target.value)}
                className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Technology name"
              />
              <button
                type="button"
                onClick={() => removeField('technology', index)}
                className="ml-2 p-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addField('technology')}
            className="mt-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add Technology
          </button>
        </div>

        {/* Services Fields */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">Services</h4>
          {formData.fields.services.map((field, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                value={field}
                onChange={(e) => handleFieldChange('services', index, e.target.value)}
                className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Service name"
              />
              <button
                type="button"
                onClick={() => removeField('services', index)}
                className="ml-2 p-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addField('services')}
            className="mt-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add Service
          </button>
        </div>

        {/* Data Fields */}
        <div>
          <h4 className="text-lg font-medium mb-3">Data</h4>
          {formData.fields.data.map((field, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                value={field}
                onChange={(e) => handleFieldChange('data', index, e.target.value)}
                className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Data name"
              />
              <button
                type="button"
                onClick={() => removeField('data', index)}
                className="ml-2 p-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addField('data')}
            className="mt-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add Data
          </button>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 rounded text-white ${loading ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {loading ? 'Saving...' : projectId ? 'Update Project' : 'Create Project'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;