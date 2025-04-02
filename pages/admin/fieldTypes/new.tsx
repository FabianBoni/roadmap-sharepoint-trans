import React from 'react';
import { useRouter } from 'next/router';
import FieldTypeForm from '../../../components/FieldTypeForm';
import Link from 'next/link';
import withAdminAuth from '@/components/withAdminAuth';

const NewFieldTypePage: React.FC = () => {
  const router = useRouter();
  
  const handleCancel = () => {
    router.push('/admin');
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create New Field Type</h1>
          <Link href="/admin">
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>
        <FieldTypeForm onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default withAdminAuth(NewFieldTypePage);