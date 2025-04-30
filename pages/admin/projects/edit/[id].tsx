import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProjectForm from '../../../../components/ProjectForm';
import withAdminAuth from '@/components/withAdminAuth';

const EditProjectPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const handleCancel = () => {
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4 px-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Projekt bearbeiten</h1>
          <Link href="/admin">
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              Zurück zum Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg shadow p-6">
          {id && typeof id === 'string' ? (
            <ProjectForm projectId={id} onCancel={handleCancel} />
          ) : (
            <div className="text-center py-8">
              <p>Projekt-ID nicht gefunden. Bitte versuchen Sie es erneut.</p>
              <button
                onClick={() => router.push('/admin')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Zurück zum Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default withAdminAuth(EditProjectPage);