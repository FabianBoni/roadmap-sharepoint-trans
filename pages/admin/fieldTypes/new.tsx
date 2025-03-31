import React from 'react';
import { useRouter } from 'next/router';
import FieldTypeForm from '../../../components/FieldTypeForm';

const NewFieldTypePage: React.FC = () => {
  const router = useRouter();
  
  const handleCancel = () => {
    router.push('/admin');
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Field Type</h1>
        <FieldTypeForm onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default NewFieldTypePage;