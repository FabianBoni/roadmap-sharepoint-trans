import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { hasAdminAccess } from '@/utils/auth';

// Define a generic type parameter for the component props
export default function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  // Use the same generic type for the returned component
  return function WithAdminAuth(props: P) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      const checkAuth = async () => {
        try {
          // Quick check with localStorage
          const isAdmin = localStorage.getItem('isAdmin');
          
          if (!isAdmin) {
            router.push('/admin/login');
            return;
          }
          
          // Verify with server
          const hasAccess = await hasAdminAccess();
          
          if (!hasAccess) {
            localStorage.removeItem('isAdmin');
            router.push('/admin/login');
            return;
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Auth check error:', error);
          router.push('/admin/login');
        }
      };
      
      checkAuth();
    }, [router]);
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}