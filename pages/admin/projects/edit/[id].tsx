import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProjectForm from '../../../../components/ProjectForm';

const EditProjectPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAdmin');
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // Add error handling for the project loading
    const fetchProject = async () => {
      try {
        // Your code to fetch project data if needed
        setLoading(false);
      } catch (err) {
        setError('Failed to load project data. Please try again: ' + err);
        setLoading(false);
      }
    };

    fetchProject();
  }, [router]);

  const handleCancel = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Ladet Daten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/admin">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
            Zurück zur Roadmap
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4 px-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bearbeiten</h1>
          <Link href="/admin">
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              Zurück zum Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <ProjectForm projectId={id as string} onCancel={handleCancel} />
        </div>
      </main>
    </div>
  );
};

export default EditProjectPage;
