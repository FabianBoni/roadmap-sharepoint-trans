import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Define the Project interface
interface Project {
  id: string;
  title: string;
  category: string;
  startQuarter: string;
  endQuarter: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  // Additional fields for detailed view
  users?: { name: string; role: string; imageUrl?: string }[];
  projektleitung?: string;
  bisher?: string;
  zukunft?: string;
  felder?: {
    process?: string[];
    technology?: string[];
    services?: string[];
    data?: string[];
  };
  fortschritt?: number; // Progress in percentage
  geplante_umsetzung?: string;
  budget?: string;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in-progress': return 'bg-blue-500';
    case 'planned': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Abgeschlossen';
    case 'in-progress': return 'In Bearbeitung';
    case 'planned': return 'Geplant';
    default: return 'Unbekannt';
  }
};

const ProjectDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/projects/${id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Project not found');
          }
          return response.json();
        })
        .then((data: Project) => {
          setProject(data);
          setLoading(false);
        })
        .catch((error: Error) => {
          console.error('Error fetching project:', error);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <p className="mb-4">Project not found</p>
        <Link href="/">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
            Zurück zur Roadmap
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header section */}
        <div className="mb-8">
          <Link href="/">
            <button className="mb-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center transition-colors">
              <span className="mr-2">←</span> Zurück zur Roadmap
            </button>
          </Link>

          <h1 className="text-3xl font-bold mb-3 text-white break-words">{project.title}</h1>

          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${getStatusColor(project.status)}`}>
            {getStatusText(project.status)}
          </span>

          <p className="text-gray-300 mb-4">
            {project.startQuarter} - {project.endQuarter}
          </p>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-gray-700 mb-8"></div>

        {/* Content grid with clear separation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 3 boxes */}
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Beschreibung</h2>
              <p className="text-gray-300 break-words">{project.description}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Bisher</h2>
              <p className="text-gray-300 break-words">{project.bisher}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">In Zukunft</h2>
              <p className="text-gray-300 break-words">{project.zukunft}</p>
            </div>
          </div>

          {/* Middle Column - 2 boxes */}
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Felder</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-400 font-medium mb-2">Process</h3>
                  <ul className="list-disc pl-5 text-gray-300">
                    {project.felder?.process?.map((item: string, index: number) => (
                      <li key={index} className="mb-1 break-words">{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-gray-400 font-medium mb-2">Technology</h3>
                  <ul className="list-disc pl-5 text-gray-300">
                    {project.felder?.technology?.map((item: string, index: number) => (
                      <li key={index} className="mb-1 break-words">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h3 className="text-gray-400 font-medium mb-2">Team Mitglieder</h3>
              <div className="space-y-4">
                {project.projektleitung && (
                  <div key='0' className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3">
                    <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center text-white text-lg">
                      {project.projektleitung[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{project.projektleitung}</p>
                      <p className="text-gray-400 text-sm truncate">Projektleitung</p>
                    </div>
                  </div>
                )}
                {project.users?.map((user: { name: string; role: string; imageUrl?: string }, index: number) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3">
                    <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center text-white text-lg">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{user.name}</p>
                      <p className="text-gray-400 text-sm truncate">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - 3 boxes */}
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Fortschritt</h2>
              <div className="mb-2 flex justify-between">
                <span className="text-gray-300">{project.fortschritt}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${project.fortschritt}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Geplante Umsetzung</h2>
              <p className="text-gray-300 break-words">{project.geplante_umsetzung}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Budget</h2>
              <p className="text-gray-300 text-2xl font-semibold">{project.budget}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProjectDetailPage;