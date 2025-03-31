import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  category: string;
  startQuarter: string;
  endQuarter: string;
  status: 'completed' | 'in-progress' | 'planned';
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
  type: 'PROCESS' | 'TECHNOLOGY' | 'SERVICE' | 'DATA';
  description: string;
}

const AdminPage: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'categories' | 'fieldTypes'>('projects');

  // Fetch projects, categories, and field types
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch projects
        const projectsResponse = await fetch('/api/projects');
        if (!projectsResponse.ok) {
          throw new Error(`Error fetching projects: ${projectsResponse.statusText}`);
        }
        const projectsData = await projectsResponse.json();

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error(`Error fetching categories: ${categoriesResponse.statusText}`);
        }
        const categoriesData = await categoriesResponse.json();

        // Fetch field types
        const fieldTypesResponse = await fetch('/api/fieldTypes');
        if (!fieldTypesResponse.ok) {
          throw new Error(`Error fetching field types: ${fieldTypesResponse.statusText}`);
        }
        const fieldTypesData = await fieldTypesResponse.json();

        setProjects(projectsData);
        setCategories(categoriesData);
        setFieldTypes(fieldTypesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Project management functions
  const handleAddProject = () => {
    router.push('/admin/projects/new');
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/admin/projects/edit/${projectId}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (deleteConfirmation !== projectId) {
      // First click - show confirmation
      setDeleteConfirmation(projectId);
      return;
    }

    // Second click - proceed with deletion
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error deleting project: ${response.statusText}`);
      }

      // Remove the project from the state
      setProjects(projects.filter(project => project.id !== projectId));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  // Category management functions
  const handleAddCategory = () => {
    router.push('/admin/categories/new');
  };

  const handleEditCategory = (categoryId: string) => {
    router.push(`/admin/categories/edit/${categoryId}`);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (deleteConfirmation !== categoryId) {
      // First click - show confirmation
      setDeleteConfirmation(categoryId);
      return;
    }

    // Second click - proceed with deletion
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error deleting category: ${response.statusText}`);
      }

      // Remove the category from the state
      setCategories(categories.filter(category => category.id !== categoryId));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category');
    }
  };

  // Field type management functions
  const handleAddFieldType = () => {
    router.push('/admin/fieldTypes/new');
  };

  const handleEditFieldType = (fieldTypeId: string) => {
    router.push(`/admin/fieldTypes/edit/${fieldTypeId}`);
  };

  const handleDeleteFieldType = async (fieldTypeId: string) => {
    if (deleteConfirmation !== fieldTypeId) {
      // First click - show confirmation
      setDeleteConfirmation(fieldTypeId);
      return;
    }

    // Second click - proceed with deletion
    try {
      const response = await fetch(`/api/fieldTypes/${fieldTypeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error deleting field type: ${response.statusText}`);
      }

      // Remove the field type from the state
      setFieldTypes(fieldTypes.filter(fieldType => fieldType.id !== fieldTypeId));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting field type:', err);
      alert('Failed to delete field type');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'planned': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatus = (status: string) => {
    switch (status) {
      case 'completed': return 'Abgeschlossen';
      case 'in-progress': return 'In Bearbeitung';
      case 'planned': return 'Geplant';
      default: return 'Unbekannt';
    }
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'PROCESS': return 'bg-blue-500';
      case 'TECHNOLOGY': return 'bg-green-500';
      case 'SERVICE': return 'bg-purple-500';
      case 'DATA': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <p>Lade Daten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Link href="/">
              <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded">
                Zurück zu Roadmap
              </button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'projects'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('projects')}
          >
            Projekte
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'categories'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('categories')}
          >
            Kategorien
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'fieldTypes'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('fieldTypes')}
          >
            Felder
          </button>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleAddProject}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Neues Projekt
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Titel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kategorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timeline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {projects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{project.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{getCategoryName(project.category)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{project.startQuarter} - {project.endQuarter}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(project.status)} text-white`}>
                          {getStatus(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditProject(project.id)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className={`${deleteConfirmation === project.id ? 'text-red-500' : 'text-red-400'} hover:text-red-300`}
                        >
                          {deleteConfirmation === project.id ? 'Bestätigen' : 'Löschen'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleAddCategory}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Neue Kategorie
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Farbe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Icon</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {categories.map(category => (
                    <tr key={category.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-6 h-6 rounded mr-2"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-sm text-gray-300">{category.color}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{category.icon}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCategory(category.id)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className={`${deleteConfirmation === category.id ? 'text-red-500' : 'text-red-400'} hover:text-red-300`}
                        >
                          {deleteConfirmation === category.id ? 'Bestätigen' : 'Löschen'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Field Types Tab */}
        {activeTab === 'fieldTypes' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleAddFieldType}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                Neues Feld
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Typ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Beschreibung</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {fieldTypes.map(fieldType => (
                    <tr key={fieldType.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{fieldType.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFieldTypeColor(fieldType.type)} text-white`}>
                          {fieldType.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{fieldType.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditFieldType(fieldType.id)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteFieldType(fieldType.id)}
                          className={`${deleteConfirmation === fieldType.id ? 'text-red-500' : 'text-red-400'} hover:text-red-300`}
                        >
                          {deleteConfirmation === fieldType.id ? 'Bestätigen' : 'Löschen'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;