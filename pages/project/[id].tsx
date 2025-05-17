import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { clientDataService } from '@/utils/clientDataService';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { Project, TeamMember } from '@/types';

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in-progress': return 'bg-blue-500';
    case 'planned': return 'bg-gray-500';
    case 'paused': return 'bg-yellow-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Abgeschlossen';
    case 'in-progress': return 'In Bearbeitung';
    case 'planned': return 'Geplant';
    case 'paused': return 'Pausiert';
    case 'cancelled': return 'Abgebrochen';
    default: return 'Unbekannt';
  }
};

// Hilfsfunktion zum Formatieren von Datumsangaben
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Improved helper function to clean up ProjectFields data
const cleanProjectFields = (fieldsData: string | string[]): string[] => {
  if (!fieldsData) return [];

  // If it's already an array, filter out empty items
  if (Array.isArray(fieldsData)) {
    return fieldsData.filter(item => item && item.trim() !== '');
  }

  // Convert to string if it's not already
  const fieldsString = fieldsData.toString();

  // First, try to extract the actual field values from the end of the string
  // Look for a pattern of words separated by semicolons at the end of the string
  const endPattern = /(?:[A-Za-zÀ-ÖØ-öø-ÿ]+(?:;\s*[A-Za-zÀ-ÖØ-öø-ÿ]+)*|[A-Za-zÀ-ÖØ-öø-ÿ]+(?:;\s*[A-Za-zÀ-ÖØ-öø-ÿ]+)*)$/;
  const matches = fieldsString.match(endPattern);

  if (matches && matches[0]) {
    // If we found a match, split by semicolon and clean each item
    return matches[0]
      .split(';')
      .map(item => item.trim())
      .filter(Boolean);
  }

  // If the above didn't work, try a more aggressive approach
  // Remove all HTML tags first
  const noHtml = fieldsString.replace(/<[^>]*>/g, '');

  // Then look for words (allowing German characters) and split them
  const words = noHtml.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+/g) || [];

  // Group words that are likely part of the same field
  // This is a heuristic approach - we're assuming fields start with capital letters
  const fields: string[] = [];
  let currentField = '';

  for (const word of words) {
    // If word starts with uppercase and we already have a current field,
    // it's likely a new field
    if (/^[A-ZÀ-ÖØ-ÿ]/.test(word) && currentField) {
      fields.push(currentField);
      currentField = word;
    } else {
      // Otherwise, append to current field
      currentField = currentField ? `${currentField} ${word}` : word;
    }
  }

  // Add the last field if there is one
  if (currentField) {
    fields.push(currentField);
  }

  return fields.filter(Boolean);
};

const ProjectDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      clientDataService.getProjectById(id as string)
        .then((data: { startDate: string; endDate: string } & Project | null) => {
          if (!data) {
            throw new Error('Project not found');
          }
          setProject(data);
          setLoading(false);
        })
        .catch((error: Error) => {
          console.error('Error fetching project:', error);
          setLoading(false);
        });
    }
  }, [id]);

  useEffect(() => {
    if (project && project.teamMembers) {
      console.log('Team members structure:', JSON.stringify(project.teamMembers, null, 2));
    }
  }, [project]);

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

          <div className="text-gray-300 mb-4">
            <p>Zeitraum: {formatDate(project.startDate)} bis {formatDate(project.endDate)}</p>
          </div>
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

            {/* Links-Bereich */}
            {project.links && project.links.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
                <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Referenzen</h2>
                <div className="space-y-3">
                  {project.links.map(link => (
                    <div key={link.id} className="bg-gray-700 p-3 rounded">
                      <div className="font-medium mb-1">{link.title}</div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center text-sm"
                      >
                        <span className="truncate">{link.url}</span>
                        <FaExternalLinkAlt className="ml-1 text-xs flex-shrink-0" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - 2 boxes */}
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Felder</h2>
              <div className="space-y-6">
                <div>
                  {project.ProjectFields ? (
                    <ul className="list-disc pl-5">
                      {cleanProjectFields(project.ProjectFields).map((item: string, index: number) => (
                        <li key={index} className="mb-2 text-gray-300 break-words">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">Keine Felder vorhanden</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h3 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white">Team</h3>
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

                {project.teamMembers && project.teamMembers.length > 0 ? (
                  project.teamMembers.map((teamMember: string | TeamMember, index: number) => {
                    const member = typeof teamMember === 'string' ? { name: teamMember, role: 'Teammitglied' } : teamMember
                    return (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3">
                        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center text-white text-lg">
                          {member.name ? member.name.charAt(0) : 'T'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{member.name || 'Team Member'}</p>
                          <p className="text-gray-400 text-sm truncate">{member.role || 'Teammitglied'}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-gray-400">Keine weiteren Team-Mitglieder</p>
                )}
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