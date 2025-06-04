import React, { useState, useEffect, useCallback } from 'react';
import { Project, Category, ProjectLink, TeamMember } from '../types';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { clientDataService } from '@/utils/clientDataService';

interface ProjectFormProps {
  initialProject?: Project;
  categories: Category[];
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialProject,
  categories,
  onSubmit,
  onCancel
}) => {
  // Grundlegende Projektdaten
  const [title, setTitle] = useState(initialProject?.title || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [status, setStatus] = useState(initialProject?.status || 'planned');
  const [startDate, setStartDate] = useState<Date | null>(
    initialProject?.startDate ? new Date(initialProject.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialProject?.endDate ? new Date(initialProject.endDate) : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialProject?.category || ''
  );

  // Zusätzliche Felder aus dem SharePoint-Schema
  const [projektleitung, setProjektleitung] = useState(initialProject?.projektleitung || '');
  const [bisher, setBisher] = useState(initialProject?.bisher || '');
  const [zukunft, setZukunft] = useState(initialProject?.zukunft || '');
  const [fortschritt, setFortschritt] = useState(initialProject?.fortschritt || 0);
  const [geplantUmsetzung, setGeplantUmsetzung] = useState(initialProject?.geplante_umsetzung || '');
  const [budget, setBudget] = useState(initialProject?.budget || '');

  // Team member search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Teammitglieder
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    if (!initialProject?.teamMembers) return [];

    // If it's already string[], convert to TeamMember objects
    if (typeof initialProject.teamMembers[0] === 'string') {
      return (initialProject.teamMembers as unknown as string[]).map(name => ({
        id: `temp-${uuidv4()}`,
        name,
        role: 'Teammitglied',
        projectId: initialProject.id
      }));
    }

    // If it's TeamMember[], use it directly
    return (initialProject.teamMembers as (string | TeamMember)[]).map(member =>
      typeof member === 'string'
        ? { id: `temp-${uuidv4()}`, name: member, role: 'Teammitglied', projectId: initialProject.id }
        : member
    );
  });

  // Links-Verwaltung
  const [links, setLinks] = useState<ProjectLink[]>(initialProject?.links || []);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Felder-Verwaltung
  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    if (!initialProject?.ProjectFields) return [];

    // Handle array of strings
    if (Array.isArray(initialProject.ProjectFields)) {
      return initialProject.ProjectFields;
    }

    // Handle string that might be semicolon or comma delimited
    if (typeof initialProject.ProjectFields === 'string') {
      const fieldStr = initialProject.ProjectFields as string;
      if (fieldStr.includes(';') || fieldStr.includes(',')) {
        return fieldStr.split(/[;,]/).map(f => f.trim()).filter(Boolean);
      }
      return [fieldStr];
    }

    return [];
  });

  // Validierung
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Team member search functionality
  const debouncedSearch = useCallback(
    (() => {
      let timeout: NodeJS.Timeout | null = null;

      return (query: string) => {
        if (timeout) clearTimeout(timeout);

        if (!query.trim()) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        setIsSearching(true);
        timeout = setTimeout(async () => {
          try {
            const results = await clientDataService.searchUsers(query);
            setSearchResults(results);
          } catch (error) {
            console.error('Error searching for users:', error);
          } finally {
            setIsSearching(false);
          }
        }, 300);
      };
    })(),
    []
  );

  // Auto-search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Function to add a team member to the project
  const handleAddTeamMember = (member: TeamMember) => {
    // Check if member is already added
    const isAlreadyAdded = teamMembers.some(m =>
      m.name.toLowerCase() === member.name.toLowerCase());

    if (isAlreadyAdded) return;

    // Create a new team member object
    const newMember = {
      id: `temp-${uuidv4()}`,
      name: member.name,
      role: 'Teammitglied', // Default role
      projectId: initialProject?.id || ''
    };

    // Update the team members state
    setTeamMembers(prevMembers => [...prevMembers, newMember]);

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  };

  // Function to remove a team member from the project
  const handleRemoveTeamMember = (memberId: string) => {
    setTeamMembers(prevMembers => prevMembers.filter(member => member.id !== memberId));
  };

  // Kategorie auswählen
  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Feld umschalten
  const toggleField = (fieldValue: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldValue)) {
        return prev.filter(name => name !== fieldValue);
      } else {
        return [...prev, fieldValue];
      }
    });
  };

  // Link hinzufügen
  const addLink = () => {
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      const newLink: ProjectLink = {
        id: uuidv4(),
        title: newLinkTitle.trim(),
        url: newLinkUrl.trim()
      };

      setLinks([...links, newLink]);
      setNewLinkTitle('');
      setNewLinkUrl('');
    }
  };

  // Link entfernen
  const removeLink = (linkId: string) => {
    setLinks(links.filter(link => link.id !== linkId));
  };

  // Formular validieren
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }

    if (!description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    }

    if (!selectedCategory) {
      newErrors.category = 'Eine Kategorie muss ausgewählt sein';
    }

    if (!startDate) {
      newErrors.startDate = 'Startdatum ist erforderlich';
    }

    if (!endDate) {
      newErrors.endDate = 'Enddatum ist erforderlich';
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.dates = 'Das Enddatum muss nach dem Startdatum liegen';
    }

    if (!projektleitung.trim()) {
      newErrors.projektleitung = 'Projektleitung ist erforderlich';
    }

    if (!bisher.trim()) {
      newErrors.bisher = 'Bisher-Feld ist erforderlich';
    }

    if (!zukunft.trim()) {
      newErrors.zukunft = 'Zukunft-Feld ist erforderlich';
    }

    if (!geplantUmsetzung.trim()) {
      newErrors.geplantUmsetzung = 'Geplante Umsetzung ist erforderlich';
    }

    // Add type check before trim for budget
    if (!budget || (typeof budget === 'string' && !budget.trim())) {
      newErrors.budget = 'Budget ist erforderlich';
    } else if (typeof budget === 'string' && !/^\d+$/.test(budget.trim())) {
      newErrors.budget = 'Budget muss eine Zahl sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formular absenden
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Berechnen der Quartale aus den Datumsangaben
    let startQuarter = '';
    let endQuarter = '';

    if (startDate) {
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      startQuarter = `Q${quarter} ${startDate.getFullYear()}`;
    }

    if (endDate) {
      const quarter = Math.floor(endDate.getMonth() / 3) + 1;
      endQuarter = `Q${quarter} ${endDate.getFullYear()}`;
    }

    const projectData: Project = {
      id: initialProject?.id || '',
      title,
      description,
      status,
      category: selectedCategory,
      startQuarter,
      endQuarter,
      startDate: startDate ? startDate.toISOString() : '',
      endDate: endDate ? endDate.toISOString() : '',
      projektleitung,
      bisher,
      zukunft,
      fortschritt,
      geplante_umsetzung: geplantUmsetzung,
      budget,
      teamMembers,
      links,
      ProjectFields: selectedFields
    };

    onSubmit(projectData);
  };
  // Definieren Sie die verfügbaren Felder
  const availableFields = [
    { id: 'process', name: 'Prozess', description: 'Prozessbezogene Aspekte' },
    { id: 'technology', name: 'Technologie', description: 'Technologische Aspekte' },
    { id: 'service', name: 'Dienstleistung', description: 'Servicebezogene Aspekte' },
    { id: 'data', name: 'Daten', description: 'Datenbezogene Aspekte' },
    { id: 'security', name: 'Sicherheit', description: 'Sicherheitsaspekte' },
    { id: 'infrastructure', name: 'Infrastruktur', description: 'Infrastrukturaspekte' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titel */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full bg-gray-800 border ${errors.title ? 'border-red-500' : 'border-gray-700'
            } rounded p-2`}
          required
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Beschreibung */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Beschreibung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`w-full bg-gray-800 border ${errors.description ? 'border-red-500' : 'border-gray-700'
            } rounded p-2`}
          required
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-1">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "planned" | "in-progress" | "completed" | "paused" | "cancelled")}
          className="w-full bg-gray-800 border border-gray-700 rounded p-2"
          required
        >
          <option value="planned">Geplant</option>
          <option value="in-progress">In Bearbeitung</option>
          <option value="completed">Abgeschlossen</option>
          <option value="paused">Pausiert</option>
          <option value="cancelled">Abgebrochen</option>
        </select>
      </div>

      {/* Datumsbereich */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            Startdatum <span className="text-red-500">*</span>
          </label>
          <DatePicker
            id="startDate"
            selected={startDate}
            onChange={setStartDate}
            className={`w-full bg-gray-800 border ${errors.startDate ? 'border-red-500' : 'border-gray-700'} rounded p-2`}
            dateFormat="dd.MM.yyyy"
            placeholderText="TT.MM.JJJJ"
            required
          />
          {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">
            Enddatum <span className="text-red-500">*</span>
          </label>
          <DatePicker
            id="endDate"
            selected={endDate}
            onChange={setEndDate}
            className={`w-full bg-gray-800 border ${errors.endDate ? 'border-red-500' : 'border-gray-700'} rounded p-2`}
            dateFormat="dd.MM.yyyy"
            placeholderText="TT.MM.JJJJ"
            minDate={startDate || undefined}
            required
          />
          {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
        </div>
      </div>
      {errors.dates && <p className="text-red-500 text-sm mt-1">{errors.dates}</p>}

      {/* Kategorien */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Kategorie <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {categories.map(category => (
            <div
              key={category.id}
              className={`flex items-center p-2 rounded cursor-pointer transition-all ${selectedCategory === category.id
                ? 'bg-gray-700 border-l-4'
                : 'bg-gray-800 opacity-70'
                }`}
              style={{
                borderLeftColor: selectedCategory === category.id
                  ? category.color
                  : 'transparent'
              }}
              onClick={() => selectCategory(category.id)}
            >
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              <span>{category.name}</span>
            </div>
          ))}
        </div>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category}</p>
        )}
      </div>

      {/* Projektleitung */}
      <div>
        <label htmlFor="projektleitung" className="block text-sm font-medium mb-1">
          Projektleitung <span className="text-red-500">*</span>
        </label>
        <input
          id="projektleitung"
          type="text"
          value={projektleitung}
          onChange={(e) => setProjektleitung(e.target.value)}
          className={`w-full bg-gray-800 border ${errors.projektleitung ? 'border-red-500' : 'border-gray-700'} rounded p-2`}
          required
        />
        {errors.projektleitung && <p className="text-red-500 text-sm mt-1">{errors.projektleitung}</p>}
      </div>

      {/* Fortschritt */}
      <div>
        <label htmlFor="fortschritt" className="block text-sm font-medium mb-1">
          Fortschritt (%)
        </label>
        <div className="flex items-center space-x-4">
          <input
            id="fortschritt"
            type="range"
            min="0"
            max="100"
            value={fortschritt}
            onChange={(e) => setFortschritt(parseInt(e.target.value))}
            className="flex-grow"
          />
          <span className="w-12 text-center">{fortschritt}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${fortschritt}%` }}
          ></div>
        </div>
      </div>

      {/* Budget */}
      <div>
        <label htmlFor="budget" className="block text-sm font-medium mb-1">
          Budget <span className="text-red-500">*</span>
        </label>
        <input
          id="budget"
          type="text"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className={`w-full bg-gray-800 border ${errors.budget ? 'border-red-500' : 'border-gray-700'} rounded p-2`}
          placeholder="Nur Zahlen eingeben (z.B. 150000)"
          required
        />
        {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
      </div>

      {/* Bisher */}
      <div>
        <label htmlFor="bisher" className="block text-sm font-medium mb-1">
          Bisher <span className="text-red-500">*</span>
        </label>
        <textarea
          id="bisher"
          value={bisher}
          onChange={(e) => setBisher(e.target.value)}
          rows={3}
          className={`w-full bg-gray-800 border ${errors.bisher ? 'border-red-500' : 'border-gray-700'} rounded p-2`}
          placeholder="Was wurde bisher erreicht?"
          required
        />
        {errors.bisher && <p className="text-red-500 text-sm mt-1">{errors.bisher}</p>}
      </div>

      {/* Zukunft */}
      <div>
        <label htmlFor="zukunft" className="block text-sm font-medium mb-1">
          In Zukunft <span className="text-red-500">*</span>
        </label>
        <textarea
          id="zukunft"
          value={zukunft}
          onChange={(e) => setZukunft(e.target.value)}
          rows={3}
          className={`w-full bg-gray-800 border ${errors.zukunft ? 'border-red-500' : 'border-gray-700'} rounded p-2`}
          placeholder="Was ist für die Zukunft geplant?"
          required
        />
        {errors.zukunft && <p className="text-red-500 text-sm mt-1">{errors.zukunft}</p>}
      </div>

      {/* Geplante Umsetzung */}
      <div>
        <label htmlFor="geplantUmsetzung" className="block text-sm font-medium mb-1">
          Geplante Umsetzung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="geplantUmsetzung"
          value={geplantUmsetzung}
          onChange={(e) => setGeplantUmsetzung(e.target.value)}
          rows={3}
          className={`w-full bg-gray-800 border ${errors.geplantUmsetzung ? 'border-red-500' : 'border-gray-700'} rounded p-2`}
          placeholder="Wie soll das Projekt umgesetzt werden?"
          required
        />
        {errors.geplantUmsetzung && <p className="text-red-500 text-sm mt-1">{errors.geplantUmsetzung}</p>}
      </div>

      {/* Felder */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Felder</h3>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-4">
            Wählen Sie die Felder aus, die für dieses Projekt relevant sind:
          </p>
          {/* For debugging */}
          <p className="text-xs text-gray-500 mb-2">Selected fields: {selectedFields.join(', ')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableFields.map(field => (
              <div key={field.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`field-${field.id}`}
                  checked={selectedFields.includes(field.name)}
                  onChange={() => toggleField(field.name)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor={`field-${field.id}`} className="text-sm">
                  {field.name}
                  {field.description && (
                    <span className="text-xs text-gray-400 block">{field.description}</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team-Mitglieder with search */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Team-Mitglieder</h3>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nach Benutzern suchen..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}

            {/* Dropdown search results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <ul>
                  {searchResults.map((user) => (
                    <li
                      key={user.id || user.name}
                      className="px-3 py-2 hover:bg-gray-600 cursor-pointer flex items-center justify-between border-b border-gray-600 last:border-0"
                      onClick={() => handleAddTeamMember(user)}
                    >
                      <span>{user.name}</span>
                      <span className="text-xs text-blue-400">Hinzufügen</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Current team members */}
          <div className="mt-5">
            <h4 className="text-sm font-medium mb-2">Aktuelle Team-Mitglieder:</h4>
            {teamMembers.length > 0 ? (
              <ul className="space-y-2">
                {teamMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between p-2 bg-gray-600 rounded"
                  >
                    <div>
                      <span>{member.name}</span>
                      <span className="ml-2 text-xs text-gray-400">({member.role || 'Teammitglied'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role || 'Teammitglied'}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setTeamMembers(prev =>
                            prev.map(m => m.id === member.id ? { ...m, role: newRole } : m)
                          );
                        }}
                        className="px-2 py-1 text-xs bg-gray-700 rounded"
                      >
                        <option value="Teammitglied">Teammitglied</option>
                        <option value="Projektleiter">Projektleiter</option>
                        <option value="Fachexperte">Fachexperte</option>
                        <option value="Stakeholder">Stakeholder</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => member.id && handleRemoveTeamMember(member.id)} className="text-red-400 hover:text-red-300 p-1"
                        aria-label="Teammitglied entfernen"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">Keine Team-Mitglieder vorhanden</p>
            )}
          </div>
        </div>
      </div>

      {/* Links-Bereich */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Referenz-Links</h3>

        {/* Liste der vorhandenen Links */}
        <div className="space-y-2 mb-4">
          {links.map(link => (
            <div key={link.id} className="flex items-center bg-gray-800 p-2 rounded">
              <div className="flex-grow">
                <div className="font-medium">{link.title}</div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-sm hover:underline"
                >
                  {link.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                className="text-red-400 hover:text-red-300 p-1"
                aria-label="Link entfernen"
              >
                <FaTrash size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Formular zum Hinzufügen neuer Links */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Link-Titel"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2"
            />
          </div>
          <div className="md:col-span-3">
            <input
              type="url"
              placeholder="URL (https://...)"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2"
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="button"
              onClick={addLink}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded flex items-center justify-center"
              disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
            >
              <FaPlus />
            </button>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
          disabled={isSubmitting}
        >
          {initialProject ? 'Aktualisieren' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;