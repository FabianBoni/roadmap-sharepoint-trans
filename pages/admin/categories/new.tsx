import React from 'react';
import { useRouter } from 'next/router';
import CategoryForm from '../../../components/CategoryForm';

const NewCategoryPage: React.FC = () => {
  const router = useRouter();
  
  const handleCancel = () => {
    router.push('/admin');
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Category</h1>
        <CategoryForm onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default NewCategoryPage;