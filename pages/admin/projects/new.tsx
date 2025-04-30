import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProjectForm from '../../../components/ProjectForm';
import withAdminAuth from '@/components/withAdminAuth';

const NewProjectPage: React.FC = () => {
  const router = useRouter();

  const handleCancel = () => {
    router.push('/admin');
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
          <ProjectForm onCancel={handleCancel} />
        </div>
      </main>
    </div>
  );
};

export default withAdminAuth(NewProjectPage);