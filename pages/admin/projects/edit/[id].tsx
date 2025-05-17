// In pages/admin/projects/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProjectForm from '../../../../components/ProjectForm';
import withAdminAuth from '@/components/withAdminAuth';
import { clientDataService } from '@/utils/clientDataService';
import { Project, Category, TeamMember } from '@/types';

const EditProjectPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (id && typeof id === 'string') {
        setLoading(true);
        try {
          const [projectData, categoriesData, teamMembersData] = await Promise.all([
            clientDataService.getProjectById(id),
            clientDataService.getAllCategories(),
            clientDataService.getTeamMembersForProject(id)
          ]);
          
          setProject(projectData);
          setCategories(categoriesData);
          setTeamMembers(teamMembersData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id]);

  const handleCancel = () => {
    router.push('/admin');
  };

  const handleSubmit = async (updatedProject: Project) => {
    try {
      // Kopie des Projekts erstellen, um die Originaldaten nicht zu verändern
      const projectToSave = { ...updatedProject };

      // Datumsfelder korrekt formatieren für SharePoint
      if (projectToSave.startDate) {
        // Wenn startDate ein ISO-String ist, formatieren wir ihn für SharePoint
        try {
          const startDate = new Date(projectToSave.startDate);
          if (!isNaN(startDate.getTime())) {
            // SharePoint erwartet Datum im Format: YYYY-MM-DDT00:00:00Z
            projectToSave.startDate = startDate.toISOString().split('T')[0] + 'T00:00:00Z';
          } else {
            // Wenn das Datum ungültig ist, setzen wir es auf null
            projectToSave.startDate = '';
          }
        } catch (e) {
          console.error('Fehler beim Formatieren des Startdatums:', e);
          projectToSave.startDate = '';
        }
      }

      if (projectToSave.endDate) {
        // Wenn endDate ein ISO-String ist, formatieren wir ihn für SharePoint
        try {
          const endDate = new Date(projectToSave.endDate);
          if (!isNaN(endDate.getTime())) {
            // SharePoint erwartet Datum im Format: YYYY-MM-DDT00:00:00Z
            projectToSave.endDate = endDate.toISOString().split('T')[0] + 'T00:00:00Z';
          } else {
            // Wenn das Datum ungültig ist, setzen wir es auf null
            projectToSave.endDate = '';
          }
        } catch (e) {
          console.error('Fehler beim Formatieren des Enddatums:', e);
          projectToSave.endDate = '';
        }
      }

      console.log('Projekt vor dem Speichern:', projectToSave);

      // Speichern des Projekts mit allen Feldern
      const savedProject = await clientDataService.saveProject(projectToSave);
      console.log('Gespeichertes Projekt:', savedProject);

      // Teammitglieder speichern, falls vorhanden
      if (Array.isArray(projectToSave.teamMembers) && projectToSave.teamMembers.length > 0) {
        // Zuerst alle vorhandenen Teammitglieder löschen
        await clientDataService.deleteTeamMembersForProject(savedProject.id);

        // Dann neue Teammitglieder hinzufügen - convert strings to TeamMember objects if needed
        const memberNames = projectToSave.teamMembers as unknown as string[];
        for (const memberName of memberNames) {
          await clientDataService.createTeamMember({
            name: memberName,
            role: 'Teammitglied',
            projectId: savedProject.id
          });
        }
      }

      // Weiterleitung zur Admin-Seite nach erfolgreichem Speichern
      router.push('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Fehler beim Speichern des Projekts: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4 px-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Projekt bearbeiten</h1>
          <Link href="/admin">
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              Zurück zum Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Projekt wird geladen...</p>
            </div>
          ) : id && typeof id === 'string' && project ? (
            <ProjectForm
              initialProject={{
                ...project,
                // Extract team member names for the form
                teamMembers: teamMembers.map(member => member.name)
              }}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ) : (
            <div className="text-center py-8">
              <p>Projekt-ID nicht gefunden. Bitte versuchen Sie es erneut.</p>
              <button
                onClick={() => router.push('/admin')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Zurück zum Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default withAdminAuth(EditProjectPage);