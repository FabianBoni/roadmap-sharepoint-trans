import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProjectForm from '../../../components/ProjectForm';
import withAdminAuth from '@/components/withAdminAuth';
import { clientDataService } from '@/utils/clientDataService';
import { Category, Project } from '@/types';

const NewProjectPage: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await clientDataService.getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCancel = () => {
    router.push('/admin');
  };

  const handleSubmit = async (project: Project) => {
    try {
      await clientDataService.saveProject(project);
      router.push('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4 px-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Neues Projekt hinzufügen</h1>
          <Link href="/admin">
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              Zurück zum Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Daten werden geladen...</p>
            </div>
          ) : (
            <ProjectForm 
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={handleCancel} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default withAdminAuth(NewProjectPage);