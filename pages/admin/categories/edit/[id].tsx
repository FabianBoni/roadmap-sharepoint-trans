import React from 'react';
import { useRouter } from 'next/router';
import CategoryForm from '../../../../components/CategoryForm';

const EditCategoryPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const handleCancel = () => {
    router.push('/admin');
  };
  
  if (!id || typeof id !== 'string') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <p>Invalid category ID</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Category</h1>
        <CategoryForm categoryId={id} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default EditCategoryPage;
