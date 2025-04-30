import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { clientDataService } from '../utils/clientDataService';

interface ProjectFormProps {
  projectId?: string;
  onCancel: () => void;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ProjectData {
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  projektleitung: string;
  bisher: string;
  zukunft: string;
  fortschritt: number;
  geplante_umsetzung: string;
  budget: string;
  teamMembers: { name: string; role: string }[];
  attributes: {
    process: boolean;
    technology: boolean;
    services: boolean;
    data: boolean;
  };
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onCancel }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Project data state
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    category: '',
    startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    endDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'planned',
    projektleitung: '',
    bisher: '',
    zukunft: '',
    fortschritt: 0,
    geplante_umsetzung: '',
    budget: '',
    teamMembers: [{ name: '', role: '' }],
    attributes: {
      process: false,
      technology: false,
      services: false,
      data: false
    }
  });

  // Fetch categories and project data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesData = await clientDataService.getAllCategories();
        setCategories(categoriesData);

        // If projectId is provided, fetch project data
        if (projectId) {
          const project = await clientDataService.getProjectById(projectId);
          if (project) {
            // Convert quarter format to date
            const startQuarterParts = project.startQuarter.split(' ');
            const endQuarterParts = project.endQuarter.split(' ');

            const startDate = getDateFromQuarter(startQuarterParts[0], parseInt(startQuarterParts[1]));
            const endDate = getDateFromQuarter(endQuarterParts[0], parseInt(endQuarterParts[1]), true);

            // Fetch team members
            const teamMembers = await clientDataService.getTeamMembersByProjectId(projectId);

            // Fetch fields
            const fields = await clientDataService.getFieldsByProjectId(projectId);

            // Check which attributes are used
            const attributes = {
              process: fields.some(f => f.type === 'PROCESS'),
              technology: fields.some(f => f.type === 'TECHNOLOGY'),
              services: fields.some(f => f.type === 'SERVICE'),
              data: fields.some(f => f.type === 'DATA')
            };

            // Update project data state
            setProjectData({
              title: project.title,
              category: project.category,
              startDate: startDate,
              endDate: endDate,
              description: project.description || '',
              status: project.status,
              projektleitung: project.projektleitung || '',
              bisher: project.bisher || '',
              zukunft: project.zukunft || '',
              fortschritt: project.fortschritt || 0,
              geplante_umsetzung: project.geplante_umsetzung || '',
              budget: project.budget || '',
              teamMembers: teamMembers.length > 0
                ? teamMembers.map(m => ({ name: m.name, role: m.role }))
                : [{ name: '', role: '' }],
              attributes
            });
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Fehler beim Laden der Daten. Bitte versuchen Sie es erneut.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Helper function to get date from quarter
  const getDateFromQuarter = (quarter: string, year: number, endOfQuarter: boolean = false): string => {
    let month: number;

    switch (quarter) {
      case 'Q1':
        month = endOfQuarter ? 3 : 1;
        break;
      case 'Q2':
        month = endOfQuarter ? 6 : 4;
        break;
      case 'Q3':
        month = endOfQuarter ? 9 : 7;
        break;
      case 'Q4':
        month = endOfQuarter ? 12 : 10;
        break;
      default:
        month = 1;
    }

    const day = endOfQuarter ? (month === 2 ? 28 : (month === 4 || month === 6 || month === 9 || month === 11) ? 30 : 31) : 1;

    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Helper function to get quarter from date
  const getQuarterFromDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    let quarter: string;
    if (month <= 3) quarter = 'Q1';
    else if (month <= 6) quarter = 'Q2';
    else if (month <= 9) quarter = 'Q3';
    else quarter = 'Q4';

    return `${quarter} ${year}`;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'planned' | 'in-progress' | 'completed';
    setProjectData(prev => ({ ...prev, status: value }));
  };

  // Handle progress change
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setProjectData(prev => ({ ...prev, fortschritt: isNaN(value) ? 0 : value }));
  };

  // Handle team member changes
  const handleTeamMemberChange = (index: number, field: 'name' | 'role', value: string) => {
    setProjectData(prev => {
      const updatedMembers = [...prev.teamMembers];
      updatedMembers[index] = { ...updatedMembers[index], [field]: value };
      return { ...prev, teamMembers: updatedMembers };
    });
  };

  // Add team member
  const addTeamMember = () => {
    setProjectData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '' }]
    }));
  };

  // Remove team member
  const removeTeamMember = (index: number) => {
    setProjectData(prev => {
      const updatedMembers = [...prev.teamMembers];
      updatedMembers.splice(index, 1);
      return { ...prev, teamMembers: updatedMembers.length ? updatedMembers : [{ name: '', role: '' }] };
    });
  };

  // Handle attribute checkbox changes
  const handleAttributeChange = (attribute: 'process' | 'technology' | 'services' | 'data') => {
    setProjectData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attribute]: !prev.attributes[attribute]
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Convert dates to quarters
      const startQuarter = getQuarterFromDate(projectData.startDate);
      const endQuarter = getQuarterFromDate(projectData.endDate);

      // Filter out empty team members
      const teamMembers = projectData.teamMembers.filter(m => m.name.trim() && m.role.trim());

      // Create fields based on selected attributes
      const fields = {
        process: projectData.attributes.process ? ['Enabled'] : [],
        technology: projectData.attributes.technology ? ['Enabled'] : [],
        services: projectData.attributes.services ? ['Enabled'] : [],
        data: projectData.attributes.data ? ['Enabled'] : []
      };

      // Prepare project data
      const projectToSave = {
        title: projectData.title,
        category: projectData.category,
        startQuarter,
        endQuarter,
        description: projectData.description,
        status: projectData.status,
        projektleitung: projectData.projektleitung,
        bisher: projectData.bisher,
        zukunft: projectData.zukunft,
        fortschritt: projectData.fortschritt,
        geplante_umsetzung: projectData.geplante_umsetzung,
        budget: projectData.budget,
        teamMembers,
        fields
      };

      console.log("Saving project with data:", projectToSave);

      if (projectId) {
        // Update existing project
        await clientDataService.updateProject(projectId, projectToSave);
      } else {
        // Create new project
        await clientDataService.createProject(projectToSave);
      }

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Fehler beim Speichern des Projekts. Bitte versuchen Sie es erneut.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Projekttitel
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={projectData.title}
            onChange={handleInputChange}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Kategorie
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={projectData.category}
            onChange={handleInputChange}
          >
            <option value="">Kategorie auswählen</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            Startdatum
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={projectData.startDate}
            onChange={handleInputChange}
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">
            Enddatum
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={projectData.endDate}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          required
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          value={projectData.status}
          onChange={handleStatusChange}
        >
          <option value="planned">Geplant</option>
          <option value="in-progress">In Bearbeitung</option>
          <option value="completed">Abgeschlossen</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          value={projectData.description}
          onChange={handleInputChange}
        />
      </div>

      {/* Project Lead */}
      <div>
        <label htmlFor="projektleitung" className="block text-sm font-medium mb-1">
          Projektleitung
        </label>
        <input
          type="text"
          id="projektleitung"
          name="projektleitung"
          required
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          value={projectData.projektleitung}
          onChange={handleInputChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Previous Work */}
        <div>
          <label htmlFor="bisher" className="block text-sm font-medium mb-1">
            Bisherige Arbeit
          </label>
          <textarea
            id="bisher"
            name="bisher"
            rows={3}
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={projectData.bisher}
            onChange={handleInputChange}
          />
        </div>

        {/* Future Work */}
        <div>
          <label htmlFor="zukunft" className="block text-sm font-medium mb-1">
            Zukünftige Arbeit
          </label>
          <textarea
            id="zukunft"
            name="zukunft"
            rows={3}
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={projectData.zukunft}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress */}
        <div>
          <label htmlFor="fortschritt" className="block text-sm font-medium mb-1">
            Fortschritt (%)
          </label>
          <input
            type="number"
            id="fortschritt"
            name="fortschritt"
            min="0"
            max="100"
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={projectData.fortschritt}
            onChange={handleProgressChange}
          />
        </div>

        {/* Budget */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium mb-1">
            Budget
          </label>
          <input
            type="text"
            id="budget"
            name="budget"
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            value={projectData.budget}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Planned Implementation */}
      <div>
        <label htmlFor="geplante_umsetzung" className="block text-sm font-medium mb-1">
          Geplante Umsetzung
        </label>
        <textarea
          id="geplante_umsetzung"
          name="geplante_umsetzung"
          rows={3}
          required
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          value={projectData.geplante_umsetzung}
          onChange={handleInputChange}
        />
      </div>

      {/* Team Members */}
      <div>
        <h3 className="text-lg font-medium mb-3">Teammitglieder</h3>
        {projectData.teamMembers.map((member, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              placeholder="Name"
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              value={member.name}
              required
              onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
            />
            <input
              type="text"
              placeholder="Rolle"
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              value={member.role}
              onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
            />
            <button
              type="button"
              className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => removeTeamMember(index)}
            >
              -
            </button>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={addTeamMember}
        >
          + Teammitglied hinzufügen
        </button>
      </div>

      {/* Project Attributes - Changed to checkboxes */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Projektattribute</h3>
        <p className="text-sm text-gray-400 mb-4">
          Wählen Sie aus, welche Attribute in der Projektbeschreibung angezeigt werden sollen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Process Attribute */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="process-attribute"
              checked={projectData.attributes.process}
              onChange={() => handleAttributeChange('process')}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded"
            />
            <label htmlFor="process-attribute" className="text-sm font-medium">
              Prozesse
            </label>
          </div>

          {/* Technology Attribute */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="technology-attribute"
              checked={projectData.attributes.technology}
              onChange={() => handleAttributeChange('technology')}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded"
            />
            <label htmlFor="technology-attribute" className="text-sm font-medium">
              Technologie
            </label>
          </div>

          {/* Services Attribute */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="services-attribute"
              checked={projectData.attributes.services}
              onChange={() => handleAttributeChange('services')}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded"
            />
            <label htmlFor="services-attribute" className="text-sm font-medium">
              Services
            </label>
          </div>

          {/* Data Attribute */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="data-attribute"
              checked={projectData.attributes.data}
              onChange={() => handleAttributeChange('data')}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded"
            />
            <label htmlFor="data-attribute" className="text-sm font-medium">
              Daten
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          disabled={submitting}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={submitting}
        >
          {submitting ? 'Speichern...' : (projectId ? 'Aktualisieren' : 'Erstellen')}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;