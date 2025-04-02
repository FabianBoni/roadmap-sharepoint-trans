import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, hasAdminAccess, redirectToLogin } from '@/utils/auth';
import Link from 'next/link';

const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated with SharePoint
        const authenticated = await isAuthenticated();
        
        if (!authenticated) {
          // Redirect to SharePoint login
          redirectToLogin();
          return;
        }
        
        // Check if user has admin access
        const isAdmin = await hasAdminAccess();
        
        if (isAdmin) {
          // Store a simple flag in localStorage
          localStorage.setItem('isAdmin', 'true');
          router.push('/admin');
        } else {
          setError('You do not have administrator privileges');
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('An error occurred while checking your credentials');
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              Checking credentials...
            </h2>
            <div className="mt-4">
              <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {error}
          </p>
        </div>
        
        <div className="mt-6">
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Roadmap
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;