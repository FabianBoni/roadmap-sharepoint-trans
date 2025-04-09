import { useEffect, useState } from 'react';
import Roadmap from '../components/Roadmap';
import { clientDataService } from '../utils/clientDataService';
import { Project } from '../types'; // Import the Project interface

const HomePage: React.FC = () => {
  // Properly type the state as Project[]
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await clientDataService.getAllProjects();
        // Now TypeScript knows what type to expect
        setProjects(data as Project[]);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <Roadmap initialProjects={projects} />;
};

export default HomePage;