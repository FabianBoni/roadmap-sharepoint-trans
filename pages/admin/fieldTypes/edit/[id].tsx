import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import FieldTypeForm from '../../../../components/FieldTypeForm';
import { FieldType, clientDataService } from '@/utils/clientDataService';
import { toast } from 'react-toastify';
import withAdminAuth from '@/components/withAdminAuth';

const EditFieldTypePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [fieldType, setFieldType] = useState<FieldType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFieldType = useCallback(async (fieldTypeId: string) => {
    try {
      setLoading(true);
      // Use clientDataService directly
      const data = await clientDataService.getFieldTypeById(fieldTypeId);
      if (data) {
        setFieldType(data);
      } else {
        toast.error('Field type not found');
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error fetching field type:', error);
      toast.error('Failed to load field type');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchFieldType(id);
    }
  }, [id, fetchFieldType]);

  const handleCancel = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Field Type</h1>
        {fieldType && <FieldTypeForm initialData={fieldType} onCancel={handleCancel} />}
      </div>
    </div>
  );
};

export default withAdminAuth(EditFieldTypePage);